import * as React from "react";

import { JourneyStepNames, RoutePath } from "./lib/models/route-paths";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import EnterAddressManuallyPage from "./routes/get-self-test-kit-for-HIV-journey/EnterAddressManuallyPage";
import EnterDeliveryAddressPage from "./routes/get-self-test-kit-for-HIV-journey/EnterDeliveryAddressPage";
import GetSelfTestKitPage from "./routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import GlobalErrorPage from "./routes/GlobalErrorPage";
import HomePage from "./routes/HomePage";
import JourneyLayout from "./layouts/JourneyLayout";
import MainLayout from "./layouts/MainLayout";
import NoAddressFoundPage from "./routes/get-self-test-kit-for-HIV-journey/NoAddressFoundPage";
import OrderTrackingPage from "./routes/OrderTrackingPage";
import { setBodyClassName } from "./js/setClassName";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: (
      <MainLayout>
        <GlobalErrorPage />
      </MainLayout>
    ),
    children: [
      {
        path: RoutePath.HomePage,
        element: <HomePage />,
      },
      {
        path: RoutePath.OrderTrackingPage,
        element: <OrderTrackingPage />,
      },
      {
        path: RoutePath.GetSelfTestKitPage,
        element: <JourneyLayout />,
        children: [
          {
            index: true,
            element: <GetSelfTestKitPage />,
          },
          {
            path: JourneyStepNames.EnterAddressManually,
            element: <EnterAddressManuallyPage />,
          },
          {
            path: JourneyStepNames.EnterDeliveryAddress,
            element: <EnterDeliveryAddressPage />,
          },
          {
            path: JourneyStepNames.NoAddressFound,
            element: <NoAddressFoundPage />,
          },
        ],
      },
    ],
  },
]);

setBodyClassName();

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
