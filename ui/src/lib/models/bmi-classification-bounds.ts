import { EthnicBackground } from '@dnhc-health-checks/shared';

export interface BmiBounds {
  underweight: { value: number; label: string };
  healthy: { value: number; label: string };
  overweight: { value: number; label: string };
  obese1: { value: number; label: string };
  obese2: { value: number; label: string };
  obese3: { value: number; label: string };
}

export const BmiClassificationBounds = {
  getClassificationBounds(ethnicBackground: EthnicBackground): {
    lower: number;
    upper: BmiBounds;
  } {
    const isWhiteOrOtherEthnicBackground =
      ethnicBackground === EthnicBackground.White ||
      ethnicBackground === EthnicBackground.Other;

    return {
      lower: 0,
      upper: isWhiteOrOtherEthnicBackground
        ? {
            underweight: { value: 18.5, label: '18.4' },
            healthy: { value: 25, label: '24.9' },
            overweight: { value: 30, label: '29.9' },
            obese1: { value: 35, label: '34.9' },
            obese2: { value: 40, label: '39.9' },
            obese3: { value: Infinity, label: '40+' }
          }
        : {
            underweight: { value: 18.5, label: '18.4' },
            healthy: { value: 23, label: '22.9' },
            overweight: { value: 27.5, label: '27.4' },
            obese1: { value: 32.5, label: '32.4' },
            obese2: { value: 37.5, label: '37.4' },
            obese3: { value: Infinity, label: '40+' }
          }
    };
  }
};
