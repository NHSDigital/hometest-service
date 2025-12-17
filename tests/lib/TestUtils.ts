export async function pauseExecutionForMiliseconds(
  milliseconds: number
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
