import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ActionsRegistry } from './actions-registry';
import logger from './logger';
import { JobType } from './types';
import { ReleaseActionsRunner } from './release-actions-runner';

const argv = yargs(hideBin(process.argv))
  .option('env', {
    type: 'string',
    demandOption: true,
    describe: 'Environment name'
  })
  .option('tag', {
    type: 'string',
    demandOption: true,
    describe: 'Tag value'
  })
  .option('jobType', {
    type: 'string',
    choices: Object.values(JobType),
    demandOption: true,
    describe: 'Job type (pre-release or post-release)'
  })
  .option('dryRun', {
    type: 'boolean',
    default: false,
    describe: 'Dry run flag'
  })
  .parseSync();

logger.info(
  `Running ${argv.jobType} actions for release ${argv.tag} on environment ${argv.env} ${argv.dryRun ? '(dry run)' : ''}`
);

(async () => {
  const actions = ActionsRegistry.getActions(argv.tag, argv.jobType);
  const runner = new ReleaseActionsRunner(actions);
  await runner.runAll(argv.env, argv.dryRun);
})().catch((err) => {
  logger.error(
    'A problem occurred while executing actions for the release',
    err
  );
  process.exit(1);
});
