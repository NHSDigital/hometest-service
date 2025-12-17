import logger from './logger';
import { type IAction } from './types';

export class ReleaseActionsRunner {
  private readonly actions: IAction[];

  constructor(actions: IAction[]) {
    this.actions = actions;
  }

  async runAll(envName: string, dryRun: boolean): Promise<void> {
    if (this.actions.length === 0) {
      logger.info('There are no actions found matching the criteria.');
      return;
    }
    for (const action of this.actions) {
      logger.info(`Executing action ${action.getActionName()}`);
      await action.run(envName, dryRun);
      await action.cleanUp();
    }
  }
}
