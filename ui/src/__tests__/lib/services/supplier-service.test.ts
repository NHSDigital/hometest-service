import supplierService from "@/lib/services/supplier-service";

describe("SupplierService", () => {
  it("returns links for Preventx", () => {
    const result = supplierService.getLinksBySupplierName("Preventx");

    expect(result).toEqual({
      sexualHealth: "https://www.sh.uk/",
      contact: "https://www.sh.uk/contact-us",
    });
  });

  it("returns links for SH24", () => {
    const result = supplierService.getLinksBySupplierName("SH24");

    expect(result).toEqual({
      sexualHealth: "https://sh24.org.uk/",
      contact: "https://freetesting.hiv/contact",
    });
  });

  it("matches supplier names case-insensitively", () => {
    const result = supplierService.getLinksBySupplierName("  pReVeNtX  ");

    expect(result).toEqual({
      sexualHealth: "https://www.sh.uk/",
      contact: "https://www.sh.uk/contact-us",
    });
  });

  it("returns empty links for unknown supplier", () => {
    const result = supplierService.getLinksBySupplierName("Unknown Supplier");

    expect(result).toEqual({
      sexualHealth: "#",
      contact: "#",
    });
  });
});
