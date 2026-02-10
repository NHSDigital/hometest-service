import { Container, Footer, Header } from "nhsuk-react-components";
import { Link, Outlet, ScrollRestoration } from "react-router-dom";

import { DEFAULT_PAGE_TITLE } from "../lib/utils/page-title";
import type React from "react";
import { RoutePath } from "../lib/models/route-paths";
import { useCommonContent } from "@/hooks";

interface MainLayoutProps {
  readonly children?: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const commonContent = useCommonContent();

  return (
    <>
      {
        // Visually hidden separator for screen readers.
        // Used with `aria-labelledby` to add a pause between two combined text fragments.
        // Defined globally to avoid code duplication and ensure consistent accessibility behavior across the app.
        <span
          id="screen-reader-text-separator"
          aria-hidden="true"
          className="nhsuk-u-visually-hidden"
        >
          :
        </span>
      }
      <ScrollRestoration />
      <Container>{children ?? <Outlet />}</Container>
    </>
  );
}
