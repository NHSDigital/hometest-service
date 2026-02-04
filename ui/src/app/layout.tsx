import type { Metadata } from "next";
import "./globals.css";
import 'nhsuk-frontend/dist/nhsuk.css';

export const metadata: Metadata = {
  title: "NHS HIV Home Test Service"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
