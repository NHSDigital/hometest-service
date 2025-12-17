#!/bin/bash

# helpers for printing coloured text
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
BOLD="\033[1m"
RESET="\033[0m"

print_red()    { echo -e "${RED}$*${RESET}"; }
print_bold_red()   { echo -e "${RED}${BOLD}$*${RESET}"; }
print_green()  { echo -e "${GREEN}$*${RESET}"; }
print_bold_green()   { echo -e "${GREEN}${BOLD}$*${RESET}"; }
print_yellow() { echo -e "${YELLOW}$*${RESET}"; }
print_bold_yellow()   { echo -e "${YELLOW}${BOLD}$*${RESET}"; }
print_blue()   { echo -e "${BLUE}$*${RESET}"; }
print_bold_blue()   { echo -e "${BLUE}${BOLD}$*${RESET}"; }

get_status_colour() {
    local status="$1"
    if [[ "$status" == "Done" || "$status" == "Ready for Sign-off" ]]; then
        print_green "$status"
    else
        print_red "$status"
    fi
}

process_tickets_with_coloured_status() {
    for ticket in "$@"; do
        IFS=$'\t' read -r team key status summary <<< "$ticket"
        local colour_status=$(get_status_colour "$status")
        local link="https://$JIRA_DOMAIN/browse/$key"
        print_hyperlink "$link" "$key"
        echo -e " | $team\t$colour_status\t$summary"
    done
}

get_ticket_numbers() {
    local text="$1"
    echo "$text" | grep -Eo -i '[Dd][Nn][Hh][Cc][ -][0-9]+' | grep -Eo '[0-9]+' | sort -u
}

get_ticket_number() {
    local text="$1"
    echo "$text" | grep -Eo -i '[Dd][Nn][Hh][Cc][ -][0-9]+' | grep -Eo '[0-9]+' | head -1
}

print_hyperlink() {
    local url="$1"
    local text="$2"

    if [[ -n "${GITHUB_ACTIONS}" ]]; then
        # github actions doesn't support hyperlinks in logs
        printf "${url}"
    else
        printf "\033]8;;${url}\033\\${text}\033]8;;\033\\"
    fi
}

print_ticket_link() {
    local commit_message="$1"
    local provided_number="$2"
    if [[ -n "$provided_number" ]]; then
        local number="$provided_number"
    else
        local number=($(get_ticket_number "$commit_message"))
    fi
    local url="https://$JIRA_DOMAIN/browse/DNHC-$number"

    print_hyperlink "$url" "DNHC-$number"
    echo " | $commit_message"
}

# Script for comparing tickets with given fix version in Jira with Git commits for given release tag or branch
# To be able to fetch tickets from Jira, personal access token is required and expected in JIRA_API_TOKEN env variable.
# You can create it in Jira: Profile > Personal Access Tokens > Create token. Then in your terminal: `export JIRA_API_TOKEN=your_token`
# Usage: ./review-release-tickets.sh <target-version> <last-version-tag> <comparison-tag-branch>
# For example: ./review-release-tickets.sh v3.2.0 v3.1.0 v3.2.0
# or ./review-release-tickets.sh v3.2.0 v3.1.0 main

# Check arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <target-version> <last-version-tag> <comparison-tag-branch>"
    exit 1
fi

if [[ -z "${JIRA_API_TOKEN+x}" ]]; then
    echo "JIRA_API_TOKEN is not set! To be able to fetch tickets from Jira, personal access token is read from JIRA_API_TOKEN env variable."
    exit 1
fi

FIX_VERSION="dhc-$1"
OLD_TAG=$2
NEW_TAG=$3

declare -a git_commits
declare -a jira_tickets

declare -a correct_version_commits
declare -a correct_version_commits_tickets
declare -a wrong_version_commits
declare -a wrong_version_commits_ticket_numbers

declare -a non_release_commits
declare -a non_release_commits_ticket_numbers
declare -a non_code_commits
declare -a non_code_commits_ticket_numbers

declare -a commits_number_zero
declare -a commits_no_ticket
declare -a tickets_no_version

declare -a team_1_correct_tickets
declare -a team_1_wrong_tickets
declare -a team_1_missing_tickets

declare -a team_2_correct_tickets
declare -a team_2_wrong_tickets
declare -a team_2_missing_tickets

is_release_branch=false
# normalise branch ref to use remote (pipeline)
if ! git show-ref --verify --quiet "refs/heads/$NEW_TAG"; then
  if git show-ref --verify --quiet "refs/remotes/origin/$NEW_TAG"; then
    NEW_TAG="origin/$NEW_TAG"

    if [[ "$NEW_TAG" == *"release/"* ]]; then
        is_release_branch=true
    fi
  else
    echo "branch or tag '$NEW_TAG' not found locally or in origin"
    exit 1
  fi
else
    if [[ "$NEW_TAG" == *"release/"* ]]; then
        is_release_branch=true
    fi
fi

GIT_RANGE="$OLD_TAG..$NEW_TAG"
if [ "$is_release_branch" = true ]; then
    print_yellow "Comparing between tag and release branch HEAD: $GIT_RANGE"
else
    print_yellow "Comparing between tag and branch: $GIT_RANGE"
fi
# Get commits between tags
print_yellow "Extracting commits between $OLD_TAG and $NEW_TAG..."
echo

# get all git commits between the last version tag and the curent target branch
while read -r line; do
    git_commits+=("$line")
done < <(git log --oneline "$GIT_RANGE")

if [ ${#git_commits[@]} -eq 0 ]; then
    commits_found=false
    echo "No commits found"
else
    commits_found=true
    print_green "Found git commits (${#git_commits[@]}):"
    printf '%s\n' "${git_commits[@]}"
    echo
fi


# get all jira tickets for target fix version

JIRA_DOMAIN="nhsd-jira.digital.nhs.uk"
JQL_QUERY="fixVersion='$FIX_VERSION'"

while IFS=$'\t' read -r team key status summary; do
    jira_tickets+=("$team"$'\t'"$key"$'\t'"$status"$'\t'"$summary")
done < <(curl -s -X GET \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "https://$JIRA_DOMAIN/rest/api/2/search?jql=$JQL_QUERY" \
  | jq -r '.issues[] | select(.fields.customfield_23212.value != "Platforms" and .fields.customfield_23212.value != "Security" and .fields.customfield_23212.value != null)
  | [.fields.customfield_23212.value, .key, .fields.status.name, .fields.summary] | @tsv' | sort)

if [ ${#jira_tickets[@]} -eq 0 ]; then
    echo "No tickets found"
    exit 0
fi


if $commits_found; then
    print_yellow "Checking all git commits ..."
    echo

    for i in "${!git_commits[@]}"; do
        echo "${git_commits[$i]}"

        # DNHC XXXX or dnhc xxxx will become separated due to the spacing so only want ticket number
        ticket_numbers=($(get_ticket_numbers "${git_commits[$i]}"))

        if [[ ${#ticket_numbers[@]} -eq 0 ]]; then
            print_yellow "Couldn't find ticket number in commit ..."
            commits_no_ticket+=("${git_commits[$i]}")
            continue
        fi

        for number in "${ticket_numbers[@]}"; do
            if [[ "$number" == "0000" ]]; then
                print_yellow "skipping commit because ticket number is 0000 ..."
                commits_number_zero+=("${number}"$'\t'"${git_commits[$i]}")
                continue
            fi

            jira_response=$(curl -s \
                -H "Authorization: Bearer $JIRA_API_TOKEN" \
                -H "Accept: application/json" \
                "https://${JIRA_DOMAIN}/rest/api/2/issue/DNHC-${number}")

            if echo "$jira_response" | jq -e '.errorMessages? | index("Issue Does Not Exist")' >/dev/null; then
                print_yellow "Jira doesn't have ticket ${number} ..."
                commits_no_ticket+=("${git_commits[$i]}")
                break
            fi

            jira_ticket=$(echo "$jira_response" | jq -r '[.fields.customfield_23212.value // "Unassigned", .key, .fields.status.name, .fields.summary] | @tsv')
            IFS=$'\t' read -r team key status summary <<< "$jira_ticket"
            print_blue "$team $key | $status | $summary"
            
            if [[ -z "$jira_ticket" ]]; then
                print_red "Failed to parse Jira ticket $number"
                break
            fi

            fix_versions=$(echo "$jira_response" | jq -r '[.fields.fixVersions[].name] | join(", ")' | tr '\n' ' ')

            if [[ "$fix_versions" == *"$FIX_VERSION"* ]]; then
                print_green "commit associated with $FIX_VERSION ticket found ..."
                correct_version_commits+=("${number}"$'\t'"${git_commits[$i]}")
                correct_version_commits_tickets+=("${jira_ticket}")
                
                if [[ "$team" == "Team 1" ]]; then
                    print_green "associated with Team 1"
                    team_1_correct_tickets+=("$jira_ticket")
                elif [[ "$team" == "Team 2" ]]; then
                    print_green "associated with Team 2"
                    team_2_correct_tickets+=("$jira_ticket")
                fi
            elif [[ "$fix_versions" == *"Non-code change"* ]]; then
                print_yellow "commit associated with non-code change ticket found ..."
                non_code_commits+=("${number}"$'\t'"${git_commits[$i]}")
                non_code_commits_ticket_numbers+=("${number}")
            elif [[ "$fix_versions" == *"non-release code"* ]]; then
                print_yellow "commit associated with non-release code ticket found ..."
                non_release_commits+=("${number}"$'\t'"${git_commits[$i]}")
                non_release_commits_ticket_numbers+=("${number}")
            elif [[ ! "$fix_versions" == *"$FIX_VERSION"* ]]; then
                print_yellow "commit associated with wrong version found ..."
                wrong_version_commits+=("${number}"$'\t'"${git_commits[$i]}")
                wrong_version_commits_ticket_numbers+=("${number}")

                if [[ "$team" == "Team 1" ]]; then
                    print_yellow "the ticket ${git_commits[$i]} is for team 1 ..."
                    team_1_wrong_tickets+=("$jira_ticket")
                elif [[ "$team" == "Team 2" ]]; then
                    print_yellow "the ticket ${git_commits[$i]} is for team 2 ..."
                    team_2_wrong_tickets+=("$jira_ticket")
                fi
            else
                print_yellow "the ticket ${git_commits[$i]} doesn't have a version ..."
                tickets_no_version+=("${number}"$'\t'"${git_commits[$i]}")
            fi
        done
    done
fi
echo
print_yellow "Checking for missing tickets ..."
for expected_ticket in "${jira_tickets[@]}"; do
    expected_ticket_number=($(get_ticket_number "${expected_ticket}"))
    found=false

    print_yellow "Checking expected ticket number: $expected_ticket_number"

    for found_ticket in "${correct_version_commits_tickets[@]}"; do
        found_ticket_number=($(get_ticket_number "${found_ticket}"))

        print_yellow "Against found ticket number: $found_ticket_number"

        if [[ "$expected_ticket_number" == "$found_ticket_number" ]]; then
            found=true
            break
        fi
    done

    if ! $found; then
        print_red "Expected ticket DNHC-$expected_ticket_number not found in git commits"

        IFS=$'\t' read -r team key status summary <<< "$expected_ticket"
        echo "$team $key | $status | $summary"

        if [[ "$team" == "Team 1" ]]; then
            print_yellow "adding to team_1_missing_tickets"
            team_1_missing_tickets+=("$expected_ticket")
        fi

        if [[ "$team" == "Team 2" ]]; then
            print_yellow "adding to team_2_missing_tickets"
            team_2_missing_tickets+=("$expected_ticket")
        fi
    fi
done

echo
print_bold_blue "Jira tickets for ${FIX_VERSION} (${#jira_tickets[@]}):"
process_tickets_with_coloured_status "${jira_tickets[@]}" | column -t -s $'\t'
echo

if [ ${#correct_version_commits[@]} -gt 0 ]; then
    print_bold_green "${FIX_VERSION} tickets with associated commits (${#correct_version_commits[@]}):"
    for commit in "${correct_version_commits[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

if [ ${#non_release_commits[@]} -gt 0 ]; then
    print_bold_green "non-release code tickets merged (${#non_release_commits[@]}):"
    for commit in "${non_release_commits[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

if [ ${#non_code_commits[@]} -gt 0 ]; then
    print_bold_green "non-code change tickets merged (${#non_code_commits[@]}):"
    for commit in "${non_code_commits[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

if [ ${#commits_number_zero[@]} -gt 0 ]; then
    print_bold_green "changes assigned dnhc-0000 (${#commits_number_zero[@]}):"
    for commit in "${commits_number_zero[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

print_missing_team_tickets() {
    local team_name="$1"
    local tickets_array=("${!2}")
    local array_size="${#tickets_array[@]}"

    if [ $array_size -gt 0 ]; then
        print_bold_red "$team_name ${FIX_VERSION} tickets with no found git commit (${array_size}):"
        process_tickets_with_coloured_status "${tickets_array[@]}" | column -t -s $'\t'

        echo
    fi
}

print_missing_team_tickets "Team 1" team_1_missing_tickets[@]
print_missing_team_tickets "Team 2" team_2_missing_tickets[@]

if [ ${#commits_no_ticket[@]} -gt 0 ]; then
    print_bold_yellow "git commits where ticket couldn't be found (${#commits_no_ticket[@]}):"
    printf '%s\n' "${commits_no_ticket[@]}"
    echo
fi

if [ ${#tickets_no_version[@]} -gt 0 ]; then
    print_bold_yellow "git commits where ticket with no fix version (${#tickets_no_version[@]}):"
    for commit in "${tickets_no_version[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

if [ ${#wrong_version_commits[@]} -gt 0 ]; then
    print_bold_yellow "tickets found not associated with $FIX_VERSION (${#wrong_version_commits[@]}):"
    for commit in "${wrong_version_commits[@]}"; do
        IFS=$'\t' read -r number message <<< "$commit"
        print_ticket_link "$message" "$number"
    done
    echo
fi

# util to process one ticket
ticket_to_json() {
    local ticket="$1"
    local merged_status="$2"
    
    IFS=$'\t' read -r team key status summary <<< "$ticket"
    
    local clean_status=$(echo "$status" | sed 's/\x1b\[[0-9;]*m//g')
    local escaped_summary=$(echo "$summary" | sed 's/"/\\"/g')
    
    echo "{\"key\":\"$key\",\"team\":\"$team\",\"status\":\"$clean_status\",\"summary\":\"$escaped_summary\",\"merged\":\"$merged_status\",\"link\":\"https://$JIRA_DOMAIN/browse/$key\"}"
}

# util to generate json list for an array of tickets
generate_release_tickets_json() {
    local array="$1"
    local merged_status="$2"

    local jsons=""
    local first=true

    for ticket in "${array[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            jsons+=","
        fi
        
        local ticket_json=$(ticket_to_json "$ticket" "$merged_status")
        jsons+="$ticket_json"
    done
    
    jsons+=""
    echo "$jsons"
}

if [ ${#team_1_correct_tickets[@]} -gt 0 ]; then
    print_bold_green "Team 1 merged release tickets (${#team_1_correct_tickets[@]}):"
    process_tickets_with_coloured_status "${team_1_correct_tickets[@]}" | column -t -s $'\t'
    echo
fi

if [ ${#team_1_missing_tickets[@]} -gt 0 ]; then
    print_bold_yellow "Team 1 not merged release tickets (${#team_1_missing_tickets[@]}):"
    process_tickets_with_coloured_status "${team_1_missing_tickets[@]}" | column -t -s $'\t'
    echo
fi


if [ ${#team_2_correct_tickets[@]} -gt 0 ]; then
    print_bold_green "Team 2 merged release tickets (${#team_2_correct_tickets[@]}):"
    process_tickets_with_coloured_status "${team_2_correct_tickets[@]}" | column -t -s $'\t'
    echo
fi

if [ ${#team_2_missing_tickets[@]} -gt 0 ]; then
    print_bold_yellow "Team 2 not merged release tickets (${#team_2_missing_tickets[@]}):"
    process_tickets_with_coloured_status "${team_2_missing_tickets[@]}" | column -t -s $'\t'
    echo
fi

create_sorted_release_tickets() {
    sorted_release_tickets=()
    
    for ticket in "${team_1_correct_tickets[@]}"; do
        sorted_release_tickets+=("$ticket"$'\t'"yes")
    done
    
    for ticket in "${team_1_missing_tickets[@]}"; do
        sorted_release_tickets+=("$ticket"$'\t'"no")
    done
    
    for ticket in "${team_2_correct_tickets[@]}"; do
        sorted_release_tickets+=("$ticket"$'\t'"yes")
    done
    
    for ticket in "${team_2_missing_tickets[@]}"; do
        sorted_release_tickets+=("$ticket"$'\t'"no")
    done

    if [ ${#sorted_release_tickets[@]} -gt 0 ]; then
        release_tickets_json_array="["
        local first=true
        
        for ticket_entry in "${sorted_release_tickets[@]}"; do
            IFS=$'\t' read -r team key status summary merged_status <<< "$ticket_entry"
            
            if [ "$first" = true ]; then
                first=false
            else
                release_tickets_json_array+=","
            fi
            
            local ticket_data="$team"$'\t'"$key"$'\t'"$status"$'\t'"$summary"
            release_tickets_json_array+=$(ticket_to_json "$ticket_data" "$merged_status")
        done
        
        release_tickets_json_array+="]"
    fi
}

create_sorted_release_tickets

if [ ${#team_1_wrong_tickets[@]} -gt 0 ]; then
    echo
    print_bold_red "Team 1 tickets merged not in release (${#team_1_wrong_tickets[@]}):"
    process_tickets_with_coloured_status "${team_1_wrong_tickets[@]}" | column -t -s $'\t'
fi

if [ ${#team_2_wrong_tickets[@]} -gt 0 ]; then
    echo
    print_bold_red "Team 2 tickets merged not in release (${#team_2_wrong_tickets[@]}):"
    process_tickets_with_coloured_status "${team_2_wrong_tickets[@]}" | column -t -s $'\t'
fi

create_sorted_other_tickets() {
    other_tickets=()
    other_tickets+=("${team_1_wrong_tickets[@]}")
    other_tickets+=("${team_2_wrong_tickets[@]}")

    if [ ${#other_tickets[@]} -gt 0 ]; then
        echo
        print_yellow "All tickets merged not in release (${#other_tickets[@]}):"
        process_tickets_with_coloured_status "${other_tickets[@]}" | column -t -s $'\t'

        other_tickets_json_array="["
        local first=true

        for ticket in "${other_tickets[@]}"; do
            if [ "$first" = true ]; then
                first=false
            else
                other_tickets_json_array+=","
            fi
            
            other_tickets_json_array+=$(ticket_to_json "$ticket" "yes")
        done
        
        other_tickets_json_array+="]"
    fi
}

create_sorted_other_tickets

generate_github_output() {
    local release_json="$1"
    local other_json="$2"

    if [ -n "$GITHUB_OUTPUT" ]; then
        # Running in GitHub Actions - output to GITHUB_OUTPUT file
        {
            echo "release_tickets=$release_json"
            echo "other_tickets=$other_json"
        } >> "$GITHUB_OUTPUT"
    fi
}

echo "$release_tickets_json_array"

generate_github_output "$release_tickets_json_array" "$other_tickets_json_array"