export function convertToInteger(value: string): number | null {
  if (value !== '') {
    const valueAsNumber = Number(value);
    if (Number.isInteger(valueAsNumber)) {
      const valueAsInt = parseInt(value, 10);
      if (!Number.isNaN(valueAsInt)) {
        return valueAsInt;
      }
    }
  }
  return null;
}

export function convertToNumber(value: string): number | null {
  if (value !== '') {
    // Replace comma with dot to handle decimal numbers in different locales
    const valueAsNumber = Number(value.replace(',', '.'));
    if (!Number.isNaN(valueAsNumber)) {
      return valueAsNumber;
    }
  }
  return null;
}

export function round(value: number | null, decimals: number): number | null {
  if (value === null) {
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
