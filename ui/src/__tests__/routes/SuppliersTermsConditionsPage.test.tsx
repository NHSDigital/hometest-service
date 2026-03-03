import "@testing-library/jest-dom";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import SuppliersTermsConditionsPage from "@/routes/SuppliersTermsConditionsPage";

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
  it("renders Preventx content for preventx supplier", () => {
    renderAt("/suppliers-terms-conditions?supplier=Preventx");

    expect(screen.getByRole("heading", { name: "Preventx terms of use" })).toBeInTheDocument();
  });

  it("renders SH24 content for sh24 supplier", () => {
    renderAt("/suppliers-terms-conditions?supplier=SH:24");

    expect(screen.getByRole("heading", { name: "SH:24 terms of use" })).toBeInTheDocument();
  });

  it("throws error for unknown supplier", () => {
    expect(() => {
      renderAt("/suppliers-terms-conditions?supplier=unknown");
    }).toThrow("Unknown supplier: unknown");
  });

  it("throws error when supplier is missing", () => {
    expect(() => {
      renderAt("/suppliers-terms-conditions");
    }).toThrow("Unknown supplier: missing supplier");
  });
});
