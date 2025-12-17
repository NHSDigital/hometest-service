/* eslint-disable jest/no-export */
export {};
describe('alcohol-consumption-journey mapper tests', () => {
  it('should map the alcohol consumption journey', () => {
    const mapper = require('../../../../src/routes/alcohol-consumption-journey/mapper');
    const mockHealthCheck = {
      questionnaire: {
        drinkAlcohol: true,
        alcoholHowOften: 'Weekly',
        alcoholDailyUnits: 2,
        alcoholConcernedRelative: false,
        alcoholFailedObligations: false,
        alcoholGuilt: false,
        alcoholMemoryLoss: false,
        alcoholMorningDrink: false,
        alcoholMultipleDrinksOneOccasion: false,
        alcoholPersonInjured: false,
        alcoholCannotStop: false
      }
    };
    const result = mapper.mapToAlcoholConsumption(mockHealthCheck);

    expect(result).toBeDefined();
    expect(result.drinkAlcohol).toBe(true);
    expect(result.alcoholHowOften).toBe('Weekly');
    expect(result.alcoholDailyUnits).toBe(2);
    expect(result.alcoholConcernedRelative).toBe(false);
    expect(result.alcoholFailedObligations).toBe(false);
    expect(result.alcoholGuilt).toBe(false);
    expect(result.alcoholMemoryLoss).toBe(false);
    expect(result.alcoholMorningDrink).toBe(false);
    expect(result.alcoholMultipleDrinksOneOccasion).toBe(false);
    expect(result.alcoholPersonInjured).toBe(false);
    expect(result.alcoholCannotStop).toBe(false);
  });
});
