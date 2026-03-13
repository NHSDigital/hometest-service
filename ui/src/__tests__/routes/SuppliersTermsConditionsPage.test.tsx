import "@testing-library/jest-dom";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import SuppliersTermsConditionsPage from "@/routes/SuppliersTermsConditionsPage";

const mockNavigate = jest.fn();
const mockSupplierLegalDocumentContent = jest.fn(
  ({ supplier }: { supplier?: string | null; documentType: "terms" | "privacy" }) => (
    <div data-testid="suppliers-terms-content">Supplier: {supplier ?? "missing"}</div>
  ),
);

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("@/layouts/PageLayout", () => ({
  __esModule: true,
  default: ({
    children,
    onBackButtonClick,
  }: {
    children: React.ReactNode;
    onBackButtonClick: () => void;
  }) => (
    <div data-testid="page-layout">
      <button onClick={onBackButtonClick}>Back</button>
      {children}
    </div>
  ),
}));

jest.mock("@/components/SupplierLegalDocumentContent", () => ({
  SupplierLegalDocumentContent: (props: {
    supplier?: string | null;
    documentType: "terms" | "privacy";
  }) => mockSupplierLegalDocumentContent(props),
}));

const renderAt = (url: string) => {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/suppliers-terms-conditions" element={<SuppliersTermsConditionsPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("SuppliersTermsConditionsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes supplier from query params to shared content component", () => {
    renderAt("/suppliers-terms-conditions?supplier=SH:24");

    expect(screen.getByTestId("suppliers-terms-content")).toHaveTextContent("Supplier: SH:24");
    expect(mockSupplierLegalDocumentContent).toHaveBeenCalledWith({
      supplier: "SH:24",
      documentType: "terms",
    });
  });

  it("passes null supplier when query param is missing", () => {
    renderAt("/suppliers-terms-conditions");

    expect(screen.getByTestId("suppliers-terms-content")).toHaveTextContent("Supplier: missing");
    expect(mockSupplierLegalDocumentContent).toHaveBeenCalledWith({
      supplier: null,
      documentType: "terms",
    });
  });

  it("navigates back when back action is triggered", () => {
    renderAt("/suppliers-terms-conditions?supplier=Preventx");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders inside PageLayout", () => {
    renderAt("/suppliers-terms-conditions?supplier=Preventx");

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
  });
});
