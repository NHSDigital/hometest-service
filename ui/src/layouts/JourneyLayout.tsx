import { Outlet } from "react-router-dom";

import { JourneyDevtools } from "@/lib/utils/JourneyDevtools";
import { CreateOrderProvider, JourneyNavigationProvider, PostcodeLookupProvider } from "@/state";

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
