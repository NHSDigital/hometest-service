import {
  DescribeRuleCommand,
  DisableRuleCommand,
  EnableRuleCommand,
  EventBridgeClient,
  ListRulesCommand,
  RuleState
} from '@aws-sdk/client-eventbridge';

export class EventBridgeService {
  eventBridgeClient: EventBridgeClient;
  envName: string;

  constructor(evnName: string) {
    this.eventBridgeClient = new EventBridgeClient({ region: 'eu-west-2' });
    this.envName = evnName;
  }

  public async getRuleName(namePrefix: string): Promise<string> {
    const input = {
      NamePrefix: `${this.envName}-${namePrefix}`
    };
    const command = new ListRulesCommand(input);
    const response = await this.eventBridgeClient.send(command);
    if (response.Rules) {
      if (response.Rules.length === 1 && response.Rules[0].Name) {
        return response.Rules[0].Name;
      }
    }
    throw new Error('Cannot find EventBridge rule name');
  }

  public async disableEventBridgeRule(ruleName: string): Promise<void> {
    const input = {
      Name: ruleName
    };
    const command = new DisableRuleCommand(input);
    await this.eventBridgeClient.send(command);
    await this.waitForRuleState(ruleName, RuleState.DISABLED);
  }

  public async enableEventBridgeRule(ruleName: string): Promise<void> {
    const input = {
      Name: ruleName
    };
    const command = new EnableRuleCommand(input);
    await this.eventBridgeClient.send(command);
    await this.waitForRuleState(ruleName, RuleState.ENABLED);
  }

  private async waitForRuleState(
    ruleName: string,
    ruleState: RuleState,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    let attempts = 0;
    const input = {
      Name: ruleName
    };
    const command = new DescribeRuleCommand(input);

    while (attempts < maxAttempts) {
      const response = await this.eventBridgeClient.send(command);
      if (response.State === ruleState) {
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(
      `Max attempts reached: EventBridge rule did not change state to ${ruleState}`
    );
    return false;
  }
}
