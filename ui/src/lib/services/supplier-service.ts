export interface SupplierLinks {
  sexualHealth: string;
  contact: string;
}

const suppliersMetadata: Record<string, SupplierLinks> = {
  preventx: {
    sexualHealth: "https://www.sh.uk/",
    contact: "https://www.sh.uk/contact-us",
  },
  sh24: {
    sexualHealth: "https://sh24.org.uk/",
    contact: "https://freetesting.hiv/contact",
  },
};

const emptySupplierLinks: SupplierLinks = {
  sexualHealth: "#",
  contact: "#",
};

class SupplierService {
  getLinksBySupplierName(supplierName: string): SupplierLinks {
    const key = supplierName.trim().toLowerCase();
    return suppliersMetadata[key] ?? emptySupplierLinks;
  }
}

const supplierService = new SupplierService();
export default supplierService;
