import "@testing-library/jest-dom";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import SuppliersPrivacyPolicyPage from "@/routes/SuppliersPrivacyPolicyPage";

const mockNavigate = jest.fn();
const mockSuppliersPrivacyPolicyContent = jest.fn(({ supplier }: { supplier?: string | null }) => (
  <div data-testid="suppliers-privacy-content">Supplier: {supplier ?? "missing"}</div>
));

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

jest.mock("@/components/SuppliersPrivacyPolicyContent", () => ({
  SuppliersPrivacyPolicyContent: (props: { supplier?: string | null }) =>
    mockSuppliersPrivacyPolicyContent(props),
}));

const renderAt = (url: string) => {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/suppliers-privacy-policy" element={<SuppliersPrivacyPolicyPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("SuppliersPrivacyPolicyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes supplier from query params to shared content component", () => {
    renderAt("/suppliers-privacy-policy?supplier=SH:24");

    expect(screen.getByTestId("suppliers-privacy-content")).toHaveTextContent("Supplier: SH:24");
    expect(mockSuppliersPrivacyPolicyContent).toHaveBeenCalledWith({ supplier: "SH:24" });
  });

  it("passes null supplier when query param is missing", () => {
    renderAt("/suppliers-privacy-policy");

    expect(screen.getByTestId("suppliers-privacy-content")).toHaveTextContent("Supplier: missing");
    expect(mockSuppliersPrivacyPolicyContent).toHaveBeenCalledWith({ supplier: null });
  });

  it("navigates back when back action is triggered", () => {
    renderAt("/suppliers-privacy-policy?supplier=Preventx");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders inside PageLayout", () => {
    renderAt("/suppliers-privacy-policy?supplier=Preventx");

    expect(screen.getByTestId("page-layout")).toBeInTheDocument();
  });
});
