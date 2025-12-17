export interface TimeoutDialogParams {
  sessionDurationMinutes: number;
  timeBeforePromptMinutes: number;
  title?: string;
  message?: string;
  messageSuffix?: string;
  keepAliveButtonText?: string;
  signOutButtonText?: string;
}

export interface Dialog {
  closeDialog: () => void;
  setAriaLabelledBy: (value: string) => void;
  addCloseHandler: (closeHandler: () => void) => void;
}
