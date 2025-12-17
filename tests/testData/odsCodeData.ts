import { v4 as uuidv4 } from 'uuid';

export interface OdsItem {
  gpOdsCode: string;
  enabled?: boolean;
  guid?: string;
  refId?: string;
  gpEmail?: string;
  gpName?: string;
  localAuthority?: string;
  validFrom?: string;
}

export function getOdsCodeJsonData(override?: Partial<OdsItem>): OdsItem {
  const odsCode: string = uuidv4();
  return {
    gpOdsCode: odsCode,
    gpEmail: `${odsCode}@mockdhctest.org`,
    gpName: `Automated Test GP`,
    localAuthority: `Automated Test ${odsCode} Authority`,
    validFrom: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10), // current date + 2 days
    ...override
  };
}

export function getOdsCodeData(override?: Partial<OdsItem>): OdsItem {
  return getOdsCodeJsonData({ enabled: true, ...override });
}
