export function convertFtToCm(
  ft: number | null | undefined,
  inch: number | null | undefined
): number | null {
  if (ft === null || ft === undefined) {
    return null;
  }
  inch = inch ?? 0;
  return ft * 30.48 + inch * 2.54;
}

export function convertCmToFtAndInches(cm: number | null | undefined): {
  ft: number | null;
  inch: number | null;
} {
  if (cm === null || cm === undefined) {
    return { ft: null, inch: null };
  }
  const inch = Math.round(cm / 2.54);
  const feet = Math.floor(inch / 12);
  const remainingInches = Math.round(inch % 12);
  return {
    ft: feet,
    inch: remainingInches
  };
}

export function convertCmToInches(
  cm: number | null | undefined
): number | null {
  if (cm === null || cm === undefined) {
    return null;
  }
  const inches = cm / 2.54;
  return Math.round(inches * 100) / 100;
}

export function convertInchesToCm(inches: number | null): number | null {
  if (inches === null) {
    return null;
  }
  const cm = inches * 2.54;
  return Math.round(cm * 100) / 100;
}

export function convertKgToLbsAndStones(kilograms: number | null | undefined): {
  stones: number | null;
  pounds: number | null;
} {
  if (kilograms === null || kilograms === undefined) {
    return { stones: null, pounds: null };
  }
  const pounds = Math.round(kilograms * 2.20462);
  const stones = Math.floor(pounds / 14);
  const remainingPounds = Math.round(pounds % 14);
  return {
    stones: stones,
    pounds: remainingPounds
  };
}

export function convertLbsAndStonesToKg(
  stones: number | null | undefined,
  pounds: number | null | undefined
): number | null {
  if (stones === null || stones === undefined) {
    return null;
  }
  pounds = pounds ?? 0;
  const totalPounds: number = stones * 14 + pounds;
  return Math.round((totalPounds / 2.20462) * 100) / 100;
}
