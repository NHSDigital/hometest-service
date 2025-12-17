import ipaddress
import requests
import json
import datetime

GITHUB_API = "https://api.github.com/meta"
FILEPATH_RELATIVE = "../stacks/non-production-resources/ip-allow-list-github-runners.ts"

COMMENTS = [
    f"// Last Updated: {datetime.datetime.now()} \n"
    "// Note - These IP Addresses shall be removed once our github runners have static IP addresses\n",
    "// I.E. If/When large runners are provisioned\n",
    "// Region - GitHub Workers (To be removed if static IP assigned)\n",
    "// Run curl https://api.github.com/meta | jq \".actions\" \n",
    "// or fetch and squash CIDRs with getGithubWorkerIPs.py\n"]

def fetch_ip_ranges():
    req = requests.get("https://api.github.com/meta")
    if req.status_code == 200:
        data = req.json()['actions']
        print(f"Found {len(data)} IP addresses")
        return data
    else:
        print(f"Failure in requesting - status {req.status_code} - {req.text}")
        exit()


def sort_v4_v6_addresses(addresses):
    ipv4_list = []
    ipv6_list = []

    for cidr in addresses:
        network = ipaddress.ip_network(cidr)
        if network.version == 4:
            ipv4_list.append(cidr)
        elif network.version == 6:
            ipv6_list.append(cidr)

    return ipv4_list, ipv6_list

def collapse_ranges(ip_ranges):
    # Convert input ranges to a list of ip_network objects
    networks = [ipaddress.ip_network(ip_range) for ip_range in ip_ranges]
    collapsed = [ipaddr for ipaddr in ipaddress.collapse_addresses(networks)]    
    return [str(net) for net in collapsed]

ranges = fetch_ip_ranges()
ipv4, ipv6 = sort_v4_v6_addresses(ranges)
collapsed_ranges_v4 = collapse_ranges(ipv4)
collapsed_ranges_v6 = collapse_ranges(ipv6)

print(f"Collapsed to: {len(collapsed_ranges_v4) + len(collapsed_ranges_v6)} CIDR Ranges")

#ranges = collapsed_ranges_v4 + collapsed_ranges_v6
ranges = collapsed_ranges_v4

with open(FILEPATH_RELATIVE, "w") as f:
    for comment in COMMENTS:
        f.write(comment)
    f.write(f"export const GHRunnersIPAddresses = {ranges};")