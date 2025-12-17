export function doesExceedAlcoholScore(auditScore: number): boolean {
  const scoreToExceed = 5;
  return auditScore >= scoreToExceed;
}
