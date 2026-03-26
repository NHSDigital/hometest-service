import "nhsuk-frontend/dist/nhsuk/nhsuk-frontend.css";

import type { Metadata } from "next";

import { DEFAULT_PAGE_TITLE } from "../lib/utils/page-title";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_TITLE,
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`antialiased`} suppressHydrationWarning>
        <script>{`
          document.body.className += ' js-enabled' + ('noModule' in HTMLScriptElement.prototype ? ' nhsuk-frontend-supported' : '');
        `}</script>
        {children}
      </body>
    </html>
  );
}
