import { LaLookupService } from "./la-lookup";

jest.mock("../__mocks__/postcode-la-mapping.json", () => ({
  TN377PT: { localAuthorityCode: "1440", region: "East Sussex" },
  BN108QN: { localAuthorityCode: "1440", region: "East Sussex" },
  M503UQ: { localAuthorityCode: "4230", region: "Salford" },
  M275AW: { localAuthorityCode: "4230", region: "Salford" },
}), { virtual: true });

describe("LaLookupService", () => {
  let service: LaLookupService;
  beforeEach(() => {
    service = new LaLookupService();
  });

  it("returns the correct local authority for a known postcode (no spaces, upper)", async () => {
    const result = await service.lookupByPostcode("TN377PT");
    expect(result).toEqual({ localAuthorityCode: "1440", region: "East Sussex" });
  });

  it("returns the correct local authority for a known postcode (lowercase, spaces)", async () => {
    const result = await service.lookupByPostcode("tn37 7pt");
    expect(result).toEqual({ localAuthorityCode: "1440", region: "East Sussex" });
  });

  it("returns null for an unknown postcode", async () => {
    const result = await service.lookupByPostcode("ZZ999ZZ");
    expect(result).toBeNull();
  });

  it("returns the correct local authority for another known postcode", async () => {
    const result = await service.lookupByPostcode("M50 3UQ");
    expect(result).toEqual({ localAuthorityCode: "4230", region: "Salford" });
  });

  it("normalizes postcodes by removing spaces and uppercasing", async () => {
    const result1 = await service.lookupByPostcode("bn10 8qn");
    const result2 = await service.lookupByPostcode("BN108QN");
    expect(result1).toEqual(result2);
  });
});
