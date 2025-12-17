import { getStepUrl } from '../lib/models/route-paths';

class ActionWrapper {
  private readonly _actionName: string;
  private readonly _possibleDestinations: DestinationActionCheck[];

  constructor(actionName: string) {
    this._actionName = actionName;
    this._possibleDestinations = [];
  }

  public get actionName(): string {
    return this._actionName;
  }

  public get possibleDestinations(): DestinationActionCheck[] {
    return this._possibleDestinations;
  }
}

export class DestinationActionCheck {
  private readonly _toActionName: string;
  private readonly _canGoToAction?: () => boolean;

  constructor(toActionName: string, canGoToAction?: () => boolean) {
    this._toActionName = toActionName;
    this._canGoToAction = canGoToAction;
  }

  public get toActionName() {
    return this._toActionName;
  }

  public get canGoToAction() {
    return this._canGoToAction;
  }
}

class StepNavigation {
  private readonly _currentAction: string;
  private readonly _actionsStack: string[];

  constructor(currentAction: string, actionStack: string[]) {
    if (!currentAction) {
      throw new Error('currentAction is null or undefined');
    }

    if (!actionStack) {
      throw new Error('actionStack is null or undefined');
    }

    this._currentAction = currentAction;
    this._actionsStack = [...actionStack];
  }

  public get actionsStack(): string[] {
    return this._actionsStack;
  }

  public get previousActionName(): string | null {
    const indexOfCurrentAction = this.actionsStack.indexOf(this._currentAction);

    if (indexOfCurrentAction > 0) {
      return this.actionsStack[indexOfCurrentAction - 1];
    }

    return null;
  }

  public get nextActionName(): string {
    return this.actionsStack[this.actionsStack.length - 1];
  }
}

export class StepManager {
  protected startAction: string;
  private readonly actions: ActionWrapper[];
  private actionStack: string[];

  constructor(startAction: string) {
    this.startAction = startAction;
    this.actions = [];
    this.actionStack = [];
  }

  addStep(
    fromActionName: string,
    destinationActionNamesIfCriteriaMet: DestinationActionCheck[]
  ): void {
    let fromAction = this.actions.find((x) => x.actionName === fromActionName);

    if (!fromAction) {
      fromAction = new ActionWrapper(fromActionName);
      this.actions.push(fromAction);
    } else if (fromAction.possibleDestinations.length > 0) {
      throw new Error(
        `Destination actions for action name "${fromActionName}" have already been specified.`
      );
    }

    if (
      destinationActionNamesIfCriteriaMet.length > 1 &&
      destinationActionNamesIfCriteriaMet.some((x) => !x.toActionName)
    ) {
      throw new Error(
        `You've specified more than one outcome for action name "${fromActionName}" and at least one of them has no criteria for navigation.`
      );
    }

    for (const destinationAction of destinationActionNamesIfCriteriaMet) {
      let toAction = this.actions.find(
        (x) => x.actionName === destinationAction.toActionName
      );

      if (!toAction) {
        toAction = new ActionWrapper(destinationAction.toActionName);
        this.actions.push(toAction);
      }

      fromAction.possibleDestinations.push(
        new DestinationActionCheck(
          destinationAction.toActionName,
          destinationAction.canGoToAction
        )
      );
    }
  }

  // A method that returns the current progress of the page flow
  getCurrentProgress(currentActionName: string): StepNavigation {
    this.actionStack = [];
    return this.getNext(currentActionName, this.startAction);
  }

  getPreviousStepUrl(
    pageUrl: string,
    currentActionName: string | null
  ): string {
    const previousAction = this.getCurrentProgress(
      currentActionName!
    ).previousActionName;
    return getStepUrl(pageUrl, previousAction);
  }

  getNextStepUrl(pageUrl: string, currentActionName: string | null): string {
    const nextAction = this.getCurrentProgress(
      currentActionName!
    ).nextActionName;
    return getStepUrl(pageUrl, nextAction);
  }

  // A helper method that recursively finds the next action to go to
  private getNext(
    currentActionName: string,
    actionName: string
  ): StepNavigation {
    // Find the action wrapper by its name
    const action = this.actions.find((x) => x.actionName === actionName)!;
    // Add the action name to the stack
    this.actionStack.push(actionName);

    // If the action has only one possible destination and its criteria is met or not specified, go to that destination
    if (
      action.possibleDestinations.length === 1 &&
      (!action.possibleDestinations[0].canGoToAction ||
        action.possibleDestinations[0].canGoToAction())
    ) {
      // If the current action is the same as this action, add the destination name to the stack and return the current progress
      if (currentActionName === action.actionName) {
        this.actionStack.push(action.possibleDestinations[0].toActionName);
        return new StepNavigation(currentActionName, this.actionStack);
      }

      // Otherwise, check if they can go any further from the destination
      return this.getNext(
        currentActionName,
        action.possibleDestinations[0].toActionName
      );
    }

    // Loop through the possible destinations of the action and find the first one that meets its criteria
    for (const possibleAction of action.possibleDestinations) {
      if (!possibleAction.canGoToAction || possibleAction.canGoToAction()) {
        // If the current action is the same as this action, add the destination name to the stack and return the current progress
        if (currentActionName === action.actionName) {
          this.actionStack.push(possibleAction.toActionName);
          return new StepNavigation(currentActionName, this.actionStack);
        }

        // Otherwise, check if they can go any further from the destination
        return this.getNext(currentActionName, possibleAction.toActionName);
      }
    }

    // If none of the possible destinations are achievable, return the current progress with this action as the next one
    return new StepNavigation(actionName, this.actionStack);
  }
}
