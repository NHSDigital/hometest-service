import { v4 as uuidv4 } from 'uuid';
import { getOdsCodeJsonData, type OdsItem } from './odsCodeData';

export interface OdsCodeJsonDataPayload {
  inserts: OdsItem[];
}

export interface OdsCodeTestDataInterface {
  odsCodesPayload: OdsCodeJsonDataPayload;
  odsCodeFileNameSuffix: string;
  dbOdsTableCheck: boolean;
  dbOdsTableCleanup: boolean;
  processedFolderDestination: string;
  testDescription: string;
}

export function multipleOdsCodesPayload(): OdsCodeJsonDataPayload {
  return {
    inserts: [getOdsCodeJsonData(), getOdsCodeJsonData()]
  };
}

export function singleOdsCodePayload(): OdsCodeJsonDataPayload {
  return {
    inserts: [getOdsCodeJsonData()]
  };
}

export function duplicatedOdsCodePayload(): OdsCodeJsonDataPayload {
  const odsCode = uuidv4();
  return {
    inserts: [
      getOdsCodeJsonData({ gpOdsCode: odsCode }),
      getOdsCodeJsonData({ gpOdsCode: odsCode })
    ]
  };
}

export function odsCodePayloadWithEmptyGpName(): OdsCodeJsonDataPayload {
  return {
    inserts: [getOdsCodeJsonData({ gpName: '' })]
  };
}

export function odsCodePayloadWithMissingGpEmail(): OdsCodeJsonDataPayload {
  const odsCodeJsonWithMissingFiled = getOdsCodeJsonData();
  delete odsCodeJsonWithMissingFiled.gpEmail;
  return {
    inserts: [odsCodeJsonWithMissingFiled]
  };
}

export function autoLoadOdsCodeTestData(): OdsCodeTestDataInterface[] {
  return [
    {
      odsCodesPayload: multipleOdsCodesPayload(),
      odsCodeFileNameSuffix: 'multiple-ods-codes',
      dbOdsTableCheck: true,
      dbOdsTableCleanup: true,
      processedFolderDestination: 'processed',
      testDescription: 'Uploading multiple ODS Codes in the single file'
    },
    {
      odsCodesPayload: singleOdsCodePayload(),
      odsCodeFileNameSuffix: 'single-ods-code',
      dbOdsTableCheck: true,
      dbOdsTableCleanup: false,
      processedFolderDestination: 'processed',
      testDescription: 'Override existing ODS Codes in the Db'
    },
    {
      odsCodesPayload: duplicatedOdsCodePayload(),
      odsCodeFileNameSuffix: 'duplicated-ods-code',
      dbOdsTableCheck: false,
      dbOdsTableCleanup: true,
      processedFolderDestination: 'errors',
      testDescription:
        'Duplicated ODS Code in the uploaded payload file is handled correctly'
    },
    {
      odsCodesPayload: odsCodePayloadWithEmptyGpName(),
      odsCodeFileNameSuffix: 'empty-gpName',
      dbOdsTableCheck: false,
      dbOdsTableCleanup: true,
      processedFolderDestination: 'errors',
      testDescription: 'File with empty gpName field is handled correctly'
    },
    {
      odsCodesPayload: odsCodePayloadWithMissingGpEmail(),
      odsCodeFileNameSuffix: 'missing-gpEmail',
      dbOdsTableCheck: false,
      dbOdsTableCleanup: true,
      processedFolderDestination: 'errors',
      testDescription: 'File with missing gpEmail field is handled correctly'
    }
  ];
}
