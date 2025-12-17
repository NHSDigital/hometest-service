import { BloodPressureLocation } from '@dnhc-health-checks/shared';
interface BloodPressureBoundary {
  lowerBoundary: number;
  upperBoundary: number;
}

interface BloodPressureBoundariesByLocation {
  [BloodPressureLocation.Monitor]: BloodPressureBoundary;
  [BloodPressureLocation.Pharmacy]: BloodPressureBoundary;
}

interface BloodPressureRanges {
  low: BloodPressureBoundariesByLocation;
  healthy: BloodPressureBoundariesByLocation;
  slightlyRaised: BloodPressureBoundariesByLocation;
  high: BloodPressureBoundariesByLocation;
}

export const systolicRanges: BloodPressureRanges = {
  low: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 70,
      upperBoundary: 90
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 70,
      upperBoundary: 90
    }
  },
  healthy: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 90,
      upperBoundary: 120
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 90,
      upperBoundary: 120
    }
  },
  slightlyRaised: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 120,
      upperBoundary: 135
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 120,
      upperBoundary: 140
    }
  },
  high: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 135,
      upperBoundary: 170
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 140,
      upperBoundary: 180
    }
  }
};

export const diastolicRanges: BloodPressureRanges = {
  low: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 40,
      upperBoundary: 60
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 40,
      upperBoundary: 60
    }
  },
  healthy: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 60,
      upperBoundary: 80
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 60,
      upperBoundary: 80
    }
  },
  slightlyRaised: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 80,
      upperBoundary: 85
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 80,
      upperBoundary: 90
    }
  },
  high: {
    [BloodPressureLocation.Monitor]: {
      lowerBoundary: 85,
      upperBoundary: 100
    },
    [BloodPressureLocation.Pharmacy]: {
      lowerBoundary: 90,
      upperBoundary: 120
    }
  }
};
