import supplierService from "@/lib/services/supplier-service";

describe("SupplierService", () => {
  it.each([
    {
      testName: "returns links for Preventx",
      supplierName: "Preventx",
      expected: {
        sexualHealth: "https://www.sh.uk/",
        contact: "https://www.sh.uk/contact-us",
      },
    },
    {
      testName: "returns links for SH24",
      supplierName: "SH24",
      expected: {
        sexualHealth: "https://sh24.org.uk/",
        contact: "https://freetesting.hiv/contact",
      },
    },
    {
      testName: "matches supplier names case-insensitively",
      supplierName: "  pReVeNtX  ",
      expected: {
        sexualHealth: "https://www.sh.uk/",
        contact: "https://www.sh.uk/contact-us",
      },
    },
    {
      testName: "returns empty links for unknown supplier",
      supplierName: "Unknown Supplier",
      expected: {
        sexualHealth: "#",
        contact: "#",
      },
    },
  ])("$testName", ({ supplierName, expected }) => {
    const result = supplierService.getLinksBySupplierName(supplierName);

    expect(result).toEqual(expected);
  });
});
