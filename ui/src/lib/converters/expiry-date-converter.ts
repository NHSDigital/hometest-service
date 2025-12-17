import dayjs from 'dayjs';

export function convertToFormattedExpiryDate(
  startingDate: string | undefined,
  daysToExpire: number
): string {
  const questionnaireCompletedAtDate = dayjs(startingDate);
  const expiryDate = questionnaireCompletedAtDate.add(daysToExpire, 'days');
  return expiryDate.format('D MMMM YYYY');
}
