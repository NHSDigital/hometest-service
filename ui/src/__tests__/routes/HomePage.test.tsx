import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { RoutePath } from "@/lib/models/route-paths";
import HomePage from "@/routes/HomePage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the self-test start page with replace", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(RoutePath.GetSelfTestKitPage, {
        replace: true,
      });
    });
  });
});
