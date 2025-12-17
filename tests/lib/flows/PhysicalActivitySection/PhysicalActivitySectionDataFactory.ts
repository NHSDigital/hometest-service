import { ExerciseOptions } from '../../../page-objects/PhysicalActivityPages/HoursExercisedPage';
import { WalkOptions } from '../../../page-objects/PhysicalActivityPages/HoursWalkedPage';
import { CycleOptions } from '../../../page-objects/PhysicalActivityPages/HoursCycledPage';
import { WorkActivityOptions } from '../../../page-objects/PhysicalActivityPages/WorkActivityPage';
import { HouseworkOptions } from '../../../page-objects/PhysicalActivityPages/HoursHouseworkPage';
import { GardeningOptions } from '../../../page-objects/PhysicalActivityPages/HoursGardeningPage';
import { WalkingPaceOptions } from '../../../page-objects/PhysicalActivityPages/WalkingPacePage';

export interface PhysicalActivitySectionFlowData {
  hoursExercised: ExerciseOptions;
  hoursWalked: WalkOptions;
  hoursCycled: CycleOptions;
  workActivity: WorkActivityOptions;
  hoursHousework?: HouseworkOptions;
  hoursGardening?: GardeningOptions;
  walkingPace?: WalkingPaceOptions;
}

export enum PhysicalActivitySectionDataType {
  HEALTHY_PATIENT = 'HEALTHY_PATIENT',
  WITHOUT_OPTIONALS = 'WITHOUT_OPTIONALS',
  HIGH_RISK_PATIENT = 'HIGH_RISK_PATIENT'
}

export class PhysicalActivitySectionDataFactory {
  readonly dataType: PhysicalActivitySectionDataType;

  constructor(dataType: PhysicalActivitySectionDataType) {
    this.dataType = dataType;
  }

  public getData(): PhysicalActivitySectionFlowData {
    switch (this.dataType) {
      case PhysicalActivitySectionDataType.HEALTHY_PATIENT:
        return {
          hoursExercised: ExerciseOptions.THREE_OR_MORE,
          hoursWalked: WalkOptions.MORE_THAN_ONE_LESS_THAN_THREE,
          hoursCycled: CycleOptions.THREE_OR_MORE,
          workActivity: WorkActivityOptions.PHYSICAL_LIGHT,
          hoursHousework: HouseworkOptions.THREE_OR_MORE,
          hoursGardening: GardeningOptions.NONE,
          walkingPace: WalkingPaceOptions.STEADY_AVERAGE
        };
      case PhysicalActivitySectionDataType.WITHOUT_OPTIONALS:
        return {
          hoursExercised: ExerciseOptions.NONE,
          hoursWalked: WalkOptions.NONE,
          hoursCycled: CycleOptions.NONE,
          workActivity: WorkActivityOptions.UNEMPLOYED
        };
      case PhysicalActivitySectionDataType.HIGH_RISK_PATIENT:
        return {
          hoursExercised: ExerciseOptions.NONE,
          hoursWalked: WalkOptions.NONE,
          hoursCycled: CycleOptions.NONE,
          workActivity: WorkActivityOptions.UNEMPLOYED,
          hoursHousework: HouseworkOptions.NONE,
          hoursGardening: GardeningOptions.NONE,
          walkingPace: WalkingPaceOptions.FAST
        };
      default:
        throw new Error('Unknown strategy type');
    }
  }
}
