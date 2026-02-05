import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";

import { Outlet } from "react-router-dom";

export default function JourneyLayout() {
  return (
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <Outlet />
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  );
}
