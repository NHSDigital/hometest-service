"use client";

import dynamic from "next/dynamic";

// Update the import path to the correct location of App.tsx or App/index.tsx
const App = dynamic(async () => import("../../app"), { ssr: false });

export function ClientOnly() {
  return <App />;
}
