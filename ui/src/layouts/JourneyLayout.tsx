import { CreateOrderProvider, JourneyNavigationProvider, PostcodeLookupProvider } from "@/state";

import { Outlet } from "react-router-dom";

export default function JourneyLayout() {
  return (
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <PostcodeLookupProvider>
        <Outlet />
        </PostcodeLookupProvider>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  );
}
