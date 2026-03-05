import { CreateOrderProvider, JourneyNavigationProvider, PostcodeLookupProvider } from "@/state";

import { JourneyDevtools } from "@/lib/utils/JourneyDevtools";
import { Outlet } from "react-router-dom";

export default function JourneyLayout() {
  return (
    <JourneyNavigationProvider>
      <CreateOrderProvider>
        <PostcodeLookupProvider>
        <JourneyDevtools />
        <Outlet />
        </PostcodeLookupProvider>
      </CreateOrderProvider>
    </JourneyNavigationProvider>
  );
}
