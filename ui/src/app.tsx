import * as React from "react";

import { JourneyStepNames, RoutePath } from "./lib/models/route-paths";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import EnterAddressManuallyPage from "./routes/get-self-test-kit-for-HIV-journey/EnterAddressManuallyPage";
import EnterDeliveryAddressPage from "./routes/get-self-test-kit-for-HIV-journey/EnterDeliveryAddressPage";
import GetSelfTestKitPage from "./routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import GlobalErrorPage from "./routes/GlobalErrorPage";
import HomePage from "./routes/HomePage";
import LoginPage from "./routes/LoginPage";
import CallbackPage from "./routes/CallbackPage";
import JourneyLayout from "./layouts/JourneyLayout";
import MainLayout from "./layouts/MainLayout";
import NoAddressFoundPage from "./routes/get-self-test-kit-for-HIV-journey/NoAddressFoundPage";
import OrderTrackingPage from "./routes/OrderTrackingPage";
import { setBodyClassName } from "./js/setClassName";
import SelectDeliveryAddressPage from "./routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";
import HowComfortablePrickingFingerPage from "./routes/get-self-test-kit-for-HIV-journey/HowComfortablePrickingFingerPage";
import { requireAuth } from "./lib/auth/requireAuth";

const router = createBrowserRouter([
  // Public routes (must NOT be guarded)
  {
    path: RoutePath.LoginPage,
    element: (
      <MainLayout>
        <LoginPage />
      </MainLayout>
    ),
    errorElement: (
      <MainLayout>
        <GlobalErrorPage />
      </MainLayout>
    ),
  },
  {
    path: RoutePath.CallbackPage,
    element: (
      <MainLayout>
        <JourneyLayout />
      </MainLayout>
    ),
    errorElement: (
      <MainLayout>
        <GlobalErrorPage />
      </MainLayout>
    ),
    children: [
      {
        index: true,
        element: <CallbackPage />,
      },
    ],
  },

  // Guarded app (everything else)
  {
    path: "/",
    element: <MainLayout />,
    loader: requireAuth,
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
          {
            path: JourneyStepNames.SelectDeliveryAddress,
            element: <SelectDeliveryAddressPage />,
          },
          {
            path: JourneyStepNames.HowComfortablePrickingFinger,
            element: <HowComfortablePrickingFingerPage />,
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
