import { LegalDocumentContent } from "@/components/LegalDocumentContent";
import { usePageContent } from "@/hooks";

type SupplierLegalDocumentType = "terms" | "privacy";

type SupplierLegalDocumentContentProps = {
  supplier?: string | null;
  documentType: SupplierLegalDocumentType;
};

export function SupplierLegalDocumentContent({
  supplier,
  documentType,
}: Readonly<SupplierLegalDocumentContentProps>) {
  const normalizedSupplier = supplier?.trim().toLowerCase();
  let pageContentKey: "suppliers-terms-conditions" | "suppliers-privacy-policy";

  switch (documentType) {
    case "terms":
      pageContentKey = "suppliers-terms-conditions";
      break;
    case "privacy":
      pageContentKey = "suppliers-privacy-policy";
      break;
    default: {
      const unsupportedDocumentType: never = documentType;
      throw new Error(`Unsupported document type: ${unsupportedDocumentType}`);
    }
  }

  const content = usePageContent(pageContentKey);

  if (!normalizedSupplier) {
    throw new Error("Unknown supplier: missing supplier");
  }

  if (!Object.hasOwn(content.suppliers, normalizedSupplier)) {
    throw new Error(`Unknown supplier: ${normalizedSupplier}`);
  }

  const supplierContent = content.suppliers[normalizedSupplier];

  return <LegalDocumentContent content={supplierContent} />;
}
