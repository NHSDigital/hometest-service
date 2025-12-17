import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import UnexpectedErrorPage from './routes/UnexpectedErrorPage';
import HomePage from './routes/HomePage';
import LoginCallbackPage from './routes/LoginCallbackPage';
import NotEligiblePage from './routes/NotEligiblePage';
import BloodPressureJourney from './routes/blood-pressure-journey/BloodPressureJourney';
import BloodTestJourney from './routes/blood-test-journey/BloodTestJourney';
import EligibilityJourney from './routes/eligibility-journey/EligibilityJourney';
import AboutYouJourney from './routes/about-you-journey/AboutYouJourney';
import AlcoholConsumptionJourney from './routes/alcohol-consumption-journey/AlcoholConsumptionJourney';
import PhysicalActivityJourney from './routes/physical-activity-journey/PhysicalActivityJourney';
import BodyMeasurementsJourney from './routes/body-measurements-journey/BodyMeasurementsJourney';
import StartHealthCheckPage from './routes/StartHealthCheckPage';
import GlobalErrorPage from './routes/GlobalErrorPage';
import TaskListPage from './routes/TaskListPage';
import LogoutPage from './routes/LogoutPage';
import SessionTimedOutPage from './routes/SessionTimedOutPage';
import SingleSignOnPage from './routes/SingleSignOnPage';
import healthCheckService from './services/health-check-service';
import ConsentNotGivenErrorPage from './routes/ConsentNotGivenErrorPage';
import NhsLoginErrorPage from './routes/NhsLoginErrorPage';
import BMIResultsPage from './routes/results/BMIResultsPage';
import MainResultsPage from './routes/results/MainResultsPage';
import BloodPressureResultsPage from './routes/results/BloodPressureResultsPage';
import DiabetesRiskResultsPage from './routes/results/Diabetes/DiabetesRiskResultsPage';
import CholesterolResultsPage from './routes/results/CholesterolResultsPage';
import PhysicalActivityResultsPage from './routes/results/PhysicalActivityResultsPage';
import AlcoholResultsPage from './routes/results/AlcoholResultsPage';
import SmokingResultsPage from './routes/results/Smoking/SmokingResultsPage';
import CheckAndSubmitYourAnswersPage from './routes/check-your-answers/CheckAndSubmitYourAnswersPage';
import { RoutePath } from './lib/models/route-paths';
import TermsAndConditions from './routes/terms-and-conditions-journey/TermsAndConditionsPage';
import patientInfoService from './services/patient-info-service';
import ProtectedRoute from './lib/route-guards/protected-route';
import HealthCheckExpiredPage from './routes/HealthCheckExpiredPage';
import DementiaPage from './routes/results/DementiaPage';
import OdsNhsNumberNotEligiblePage from './routes/OdsNhsNumberNotEligiblePage';
import HealthCheckVersionMigration from './routes/health-check-version-migration/HealthCheckVersionMigrationPage';
import { setBodyClassName } from './js/setClassName';
import BloodTestDataExpiredShutterPage from './routes/BloodTestDataExpiredShutterPage';
import AboutThisSoftwarePage from './routes/AboutThisSoftwarePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: (
      <MainLayout>
        <GlobalErrorPage />
      </MainLayout>
    ),
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute
            healthCheckApiService={healthCheckService}
            patientInfoService={patientInfoService}
          />
        ),
        children: [
          {
            path: RoutePath.HomePage,
            element: <HomePage />
          },
          {
            path: RoutePath.StartHealthCheckPage,
            element: <StartHealthCheckPage />
          },
          {
            path: RoutePath.TermsAndConditions,
            element: (
              <TermsAndConditions
                healthCheckApiService={healthCheckService}
                patientInfoService={patientInfoService}
              />
            )
          },
          {
            path: RoutePath.HealthCheckVersionMigration,
            element: (
              <HealthCheckVersionMigration
                healthCheckApiService={healthCheckService}
              />
            )
          },
          {
            path: RoutePath.TaskListPage,
            element: <TaskListPage />
          },
          {
            path: RoutePath.EligibilityJourney,
            element: <EligibilityJourney />
          },
          {
            path: RoutePath.BloodPressureJourney,
            element: <BloodPressureJourney />
          },
          { path: RoutePath.AboutYouJourney, element: <AboutYouJourney /> },
          {
            path: RoutePath.AlcoholConsumptionJourney,
            element: <AlcoholConsumptionJourney />
          },
          {
            path: RoutePath.PhysicalActivityJourney,
            element: <PhysicalActivityJourney />
          },
          {
            path: RoutePath.BodyMeasurementsJourney,
            element: <BodyMeasurementsJourney />
          },
          { path: RoutePath.BloodTestJourney, element: <BloodTestJourney /> },
          {
            path: RoutePath.MainResultsPage,
            element: <MainResultsPage />
          },
          { path: RoutePath.BMIResultsPage, element: <BMIResultsPage /> },
          {
            path: RoutePath.BloodPressureResultsPage,
            element: <BloodPressureResultsPage />
          },
          {
            path: RoutePath.DiabetesRiskResultsPage,
            element: <DiabetesRiskResultsPage />
          },
          {
            path: RoutePath.CholesterolResultsPage,
            element: <CholesterolResultsPage />
          },
          {
            path: RoutePath.AlcoholResultsPage,
            element: <AlcoholResultsPage />
          },
          {
            path: RoutePath.SmokingResultsPage,
            element: <SmokingResultsPage />
          },
          {
            path: RoutePath.PhysicalActivityResultsPage,
            element: <PhysicalActivityResultsPage />
          },
          {
            path: RoutePath.CheckAndSubmitYourAnswersPage,
            element: <CheckAndSubmitYourAnswersPage />
          },
          {
            path: RoutePath.DementiaPage,
            element: <DementiaPage />
          }
        ]
      },
      { path: RoutePath.SingleSignOnPage, element: <SingleSignOnPage /> },
      {
        path: RoutePath.LoginCallbackPage,
        element: <LoginCallbackPage />
      },
      { path: RoutePath.LogoutPage, element: <LogoutPage /> },
      { path: RoutePath.SessionTimedOutPage, element: <SessionTimedOutPage /> },
      { path: RoutePath.UnexpectedErrorPage, element: <UnexpectedErrorPage /> },
      {
        path: RoutePath.ConsentNotGivenErrorPage,
        element: <ConsentNotGivenErrorPage />
      },
      { path: RoutePath.NhsLoginErrorPage, element: <NhsLoginErrorPage /> },
      {
        path: RoutePath.HealthCheckExpiredPage,
        element: <HealthCheckExpiredPage />
      },
      {
        path: RoutePath.BloodTestDataExpiredShutterPage,
        element: <BloodTestDataExpiredShutterPage />
      },
      { path: RoutePath.NotEligiblePage, element: <NotEligiblePage /> },
      {
        path: RoutePath.OdsNhsNumberNotEligiblePage,
        element: <OdsNhsNumberNotEligiblePage />
      },
      {
        path: RoutePath.AboutThisSoftwarePage,
        element: <AboutThisSoftwarePage />
      }
    ]
  }
]);

setBodyClassName();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
