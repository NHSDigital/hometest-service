import { ResultStatus } from "../../lib/types/status";

export enum InterpretationCode {
  Normal = "N",
  Abnormal = "A",
}

export const resultCodeMapping: {
  [key in InterpretationCode]: ResultStatus;
} = {
  [InterpretationCode.Normal]: ResultStatus.Result_Available,
  [InterpretationCode.Abnormal]: ResultStatus.Result_Withheld,
};
