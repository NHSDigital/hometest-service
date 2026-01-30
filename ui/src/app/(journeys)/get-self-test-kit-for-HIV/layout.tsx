import { JourneyNavigationProvider, CreateOrderProvider } from "@/state";

export default function HIVTestJourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        {children}
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  );
}
