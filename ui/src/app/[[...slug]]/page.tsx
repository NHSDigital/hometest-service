import type { Metadata } from "next";

import { DEFAULT_PAGE_TITLE } from "../../lib/utils/page-title";
import { ClientOnly } from "./client";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_TITLE,
};

export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function Page() {
  return <ClientOnly />;
}
