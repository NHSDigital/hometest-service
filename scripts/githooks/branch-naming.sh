#!/bin/bash

echo "Checking branch name..."

local_branch="$(git rev-parse --abbrev-ref HEAD)"

branch_regex='^(feature|bug|epic|security)\/(dnhc)-([0-9]+)\/([a-z0-9\-]+)$'

if [[ ! $local_branch =~ $branch_regex ]]
then
    printf "\e[1;31m=================================================================\n"
    printf "Incorrect branch naming!\n"
    printf "Please rename your branch using the guidelines available on the page below:\e[0m \n"
    printf "\e[1;34mhttps://nhsd-confluence.digital.nhs.uk/display/DHC/Git+Practices \n"
    printf "\e[1;31m=================================================================\e[0m\n"
    exit 1
fi

exit 0