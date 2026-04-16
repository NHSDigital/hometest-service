/**
 * Shared test utilities for component integration testing
 */

/**
 * Configuration for testing component initialization order
 */
export interface ComponentOrderTestConfig {
  /** The initialization function to call */
  initFn: () => void;
  /** Array of components to verify in order, each with a mock and expected call */
  components: Array<{
    /** The mocked constructor */
    mock: jest.Mock;
    /** Expected number of times to be called */
    times?: number;
    /** Expected call arguments */
    calledWith?: unknown;
  }>;
}

/**
 * Test that components are created in the correct order
 * @param config - Configuration for the component order test
 */
export function testComponentCreationOrder(config: ComponentOrderTestConfig): void {
  config.initFn();

  config.components.forEach(({ mock, times = 1, calledWith }) => {
    expect(mock).toHaveBeenCalledTimes(times);
    if (calledWith !== undefined) {
      expect(mock).toHaveBeenCalledWith(calledWith);
    }
  });
}
