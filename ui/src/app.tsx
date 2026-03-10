import * as React from "react";

import { JourneyStepNames, RoutePath } from "./lib/models/route-paths";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import BloodSampleGuidePage from "./routes/get-self-test-kit-for-HIV-journey/BloodSampleGuidePage";
import CallbackPage from "./routes/CallbackPage";
import CheckYourAnswersPage from "./routes/get-self-test-kit-for-HIV-journey/CheckYourAnswersPage";
import ConfirmMobileNumberPage from "./routes/get-self-test-kit-for-HIV-journey/ConfirmMobileNumberPage";
import EnterAddressManuallyPage from "./routes/get-self-test-kit-for-HIV-journey/EnterAddressManuallyPage";
import EnterDeliveryAddressPage from "./routes/get-self-test-kit-for-HIV-journey/EnterDeliveryAddressPage";
import EnterMobileNumberPage from "./routes/get-self-test-kit-for-HIV-journey/EnterMobileNumberPage";
import FormSuppliersPrivacyPolicyPage from "./routes/get-self-test-kit-for-HIV-journey/FormSuppliersPrivacyPolicyPage";
import FormSuppliersTermsConditionsPage from "./routes/get-self-test-kit-for-HIV-journey/FormSuppliersTermsConditionsPage";
import GetSelfTestKitPage from "./routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import GlobalErrorPage from "./routes/GlobalErrorPage";
import HomePage from "./routes/HomePage";
import HomeTestPrivacyPolicyPage from "./routes/HomeTestPrivacyPolicyPage";
import HowComfortablePrickingFingerPage from "./routes/get-self-test-kit-for-HIV-journey/HowComfortablePrickingFingerPage";
import JourneyLayout from "./layouts/JourneyLayout";
import KitNotAvailableInAreaPage from "./routes/get-self-test-kit-for-HIV-journey/KitNotAvailableInAreaPage";
import GoToClinicPage from "./routes/get-self-test-kit-for-HIV-journey/GoToClinicPage";
import LoginPage from "./routes/LoginPage";
import MainLayout from "./layouts/MainLayout";
import NoAddressFoundPage from "./routes/get-self-test-kit-for-HIV-journey/NoAddressFoundPage";
import OrderSubmittedPage from "./routes/get-self-test-kit-for-HIV-journey/OrderSubmittedPage";
import OrderTrackingPage from "./routes/OrderTrackingPage";
import SelectDeliveryAddressPage from "./routes/get-self-test-kit-for-HIV-journey/SelectDeliveryAddressPage";
import SuppliersPrivacyPolicyPage from "./routes/SuppliersPrivacyPolicyPage";
import SuppliersTermsConditionsPage from "./routes/SuppliersTermsConditionsPage";
import TestResultsPage from "./routes/TestResultsPage";
import { requireAuth } from "@/lib/auth/requireAuth";
import { setBodyClassName } from "./js/setClassName";
import CannotUseServiceUnder18Page from "./routes/get-self-test-kit-for-HIV-journey/CannotUseServiceUnder18Page";

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
        path: RoutePath.TestResultsPage,
        element: <TestResultsPage />,
      },
      {
        path: RoutePath.SuppliersTermsConditions,
        element: <SuppliersTermsConditionsPage />,
      },
      {
        path: RoutePath.SuppliersPrivacyPolicy,
        element: <SuppliersPrivacyPolicyPage />,
      },
      {
        path: RoutePath.HomeTestPrivacyPolicyPage,
        element: <HomeTestPrivacyPolicyPage />,
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
            path: JourneyStepNames.KitNotAvailableInArea,
            element: <KitNotAvailableInAreaPage />,
          },
          {
            path: JourneyStepNames.GoToClinic,
            element: <GoToClinicPage />,
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
            path: JourneyStepNames.ConfirmMobileNumber,
            element: <ConfirmMobileNumberPage />,
          },
          {
            path: JourneyStepNames.CheckYourAnswers,
            element: <CheckYourAnswersPage />,
          },
          {
            path: JourneyStepNames.OrderSubmitted,
            element: <OrderSubmittedPage />,
          },
          {
            path: JourneyStepNames.SuppliersTermsConditions,
            element: <FormSuppliersTermsConditionsPage />,
          },
          {
            path: JourneyStepNames.SuppliersPrivacyPolicy,
            element: <FormSuppliersPrivacyPolicyPage />,
          },
          {
            path: JourneyStepNames.CannotUseServiceUnder18,
            element: <CannotUseServiceUnder18Page />,
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
