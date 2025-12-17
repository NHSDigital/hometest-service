import * as fs from 'fs';

interface TicketData {
  key: string;
  team: string;
  status: string;
  summary: string;
  merged: string;
  link: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

// map for team 1 amd team 2 names

const getTeamEmoji = (team: string): string => {
  const teamMap: Record<string, string> = {
    'Team 1': ':one:',
    'Team 2': ':two:'
  };

  return teamMap[team] || ':jira_unknown:';
};

// map for merged status yes and no
// based on whether it can be found in base branch (main or release branch)

const getMergedEmoji = (merged: string): string => {
  const mergedMap: Record<string, string> = {
    yes: ':white_check_mark:',
    no: ':red_negative_cross:'
  };

  return mergedMap[merged.toLowerCase()] || ':jira_unknown:';
};

// status is the ticket status

const getStatusEmoji = (status: string): string => {
  const statusMap: Record<string, string> = {
    Backlog: ':alert:',
    'To Do': ':alert:',
    'In Development': ':alert:',
    'Ready for Review': ':alert:',
    'In Review': ':alert:',
    'Ready for Test': ':eyes:',
    'In Test': ':eyes:',
    'Ready for Merge': ':eyes:',
    'Ready for Sign-off': ':bongocat:',
    Done: ':bongocat:'
  };

  return statusMap[status] || ':jira-unknown:';
};

// generate link of ticket and summary line

const blocks: SlackBlock[] = [];

const buildTicketInfoSection = (tickets: TicketData[]) => {
  tickets.forEach((ticket) => {
    const teamEmoji = getTeamEmoji(ticket.team);
    const mergedEmoji = getMergedEmoji(ticket.merged);
    const statusEmoji = getStatusEmoji(ticket.status);

    const text = `*Team:* ${teamEmoji} \t *Merged:* ${mergedEmoji} \t *Status:* ${ticket.status} ${statusEmoji} \n*<${ticket.link}|${ticket.key}>:* ${ticket.summary}`;

    console.error('adding ticket:', text);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text
      }
    });
  });
};

const formatTicketReview = (
  releaseTickets: TicketData[],
  otherTickets: TicketData[],
  version: string
) => {
  if (releaseTickets.length > 0) {
    console.error('building release tickets section ...');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Tickets for ${version}*`
      }
    });

    buildTicketInfoSection(releaseTickets);
  } else {
    console.error(`no tickets for ${version} found ...`);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*There are no tickets for ${version}*`
      }
    });
  }

  blocks.push({ type: 'divider' });

  if (otherTickets.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Tickets with commits not tagged ${version}*`
      }
    });

    buildTicketInfoSection(otherTickets);
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*All commits are for tickets expected in release :bongocathyper_blue:*`
      }
    });
  }

  if (releaseTickets.length === 0 && otherTickets.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*There are no tickets to review*`
      }
    });
  } else {
    blocks.push(
      { type: 'divider' },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: 'The ticket statuses are currently mapped with ranges:\n'
              }
            ]
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'emoji',
                    name: 'alert'
                  },
                  {
                    type: 'text',
                    text: ' in backlog - needs review'
                  }
                ]
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'emoji',
                    name: 'eyes'
                  },
                  {
                    type: 'text',
                    text: ' ready to test - ready to merge'
                  }
                ]
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'emoji',
                    name: 'bongocat'
                  },
                  {
                    type: 'text',
                    text: ' merged - done '
                  }
                ]
              }
            ]
          }
        ]
      }
    );
  }
};

const parseArray = <T>(envVar: string | undefined): T[] => {
  if (!envVar || envVar === '[]') return [];
  try {
    return JSON.parse(envVar) as T[];
  } catch (error) {
    console.error('Failed to parse array:', error);
    return [];
  }
};

console.error('formatting tickets ...');
const releaseTickets: TicketData[] = parseArray(process.env.RELEASE_TICKETS);
const otherTickets: TicketData[] = parseArray(process.env.OTHER_TICKETS);
console.error(releaseTickets, otherTickets);

formatTicketReview(releaseTickets, otherTickets, process.env.VERSION ?? '');

const json = JSON.stringify(blocks, null, 2);
fs.writeFileSync('release-tickets-blocks.json', json);
