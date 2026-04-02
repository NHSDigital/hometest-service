const baseHeaders = {
  "Content-Type": "application/json",
};

const fhirHeaders = {
  "Content-Type": "application/fhir+json",
};

export function createRandomGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function buildHeaders() {
  return {
    ...baseHeaders,
    "X-Correlation-ID": createRandomGuid(),
  };
}

export function buildFhirHeaders() {
  return {
    ...fhirHeaders,
    "X-Correlation-ID": createRandomGuid(),
  };
}

export function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must contain a header and at least one data row");
  }

  const headersRow = lines[0].split(",").map((item) => item.trim());
  const requiredHeaders = ["supplierId", "birthDate", "nhsNumber"];

  for (const requiredHeader of requiredHeaders) {
    if (!headersRow.includes(requiredHeader)) {
      throw new Error(`CSV is missing required header: ${requiredHeader}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const row = Object.fromEntries(headersRow.map((header, idx) => [header, values[idx] || ""]));

    for (const requiredHeader of requiredHeaders) {
      if (!row[requiredHeader]) {
        throw new Error(`CSV row ${index + 2} has an empty ${requiredHeader} value`);
      }
    }

    return row;
  });
}
