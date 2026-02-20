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
import BloodSampleGuidePage from "./routes/get-self-test-kit-for-HIV-journey/BloodSampleGuidePage";
import EnterMobileNumberPage from "./routes/get-self-test-kit-for-HIV-journey/EnterMobileNumberPage";
import CheckYourAnswersPage from "./routes/get-self-test-kit-for-HIV-journey/CheckYourAnswersPage";

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
        path: RoutePath.LoginPage,
        element: <LoginPage />,
      },
      {
        path: RoutePath.CallbackPage,
        element: <JourneyLayout />,
        children: [
          {
            index: true,
            element: <CallbackPage />,
          },
        ],
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
          {
            path: JourneyStepNames.BloodSampleGuide,
            element: <BloodSampleGuidePage />,
          },
          {
            path: JourneyStepNames.EnterMobileNumber,
            element: <EnterMobileNumberPage />,
          },
          {
            path: JourneyStepNames.CheckYourAnswers,
            element: <CheckYourAnswersPage />,
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
