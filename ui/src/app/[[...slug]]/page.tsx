import { ClientOnly } from "./client";
import { DEFAULT_PAGE_TITLE } from "../../lib/utils/page-title";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_TITLE,
};

export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function Page() {
  return <ClientOnly />;
}
