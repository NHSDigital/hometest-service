import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import {
  useHealthCheck,
  useHealthCheckMutation
} from '../../hooks/healthCheckHooks';
import userEvent from '@testing-library/user-event';
import { type Router } from '@remix-run/router';
import {
  AlcoholEventsFrequency,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { RoutePath } from '../../lib/models/route-paths';
import { CacheKeys } from '../../lib/models/cache-keys';

function TestComponent() {
  const query = useHealthCheck();
  const mutation = useHealthCheckMutation();

  if (query.isPending) {
    return <>Pending...</>;
  }

  if (mutation.isSuccess) {
    return <>Mutation success</>;
  }

  return (
    <>
      <button
        onClick={() =>
          mutation.mutate({
            answers: { alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost }
          })
        }
      >
        Click me
      </button>
    </>
  );
}

describe('HealthCheckHooks tests', () => {
  window.nhsapp = {
    tools: { isOpenInNHSApp: () => false }
  };
  const server = setupServer();
  const queryClient = new QueryClient();
  let memoryRouter: Router;
  beforeEach(() => {
    memoryRouter = createMemoryRouter([
      { path: RoutePath.HomePage, element: <TestComponent /> },
      { path: RoutePath.UnexpectedErrorPage, element: <div>Error</div> },
      { path: RoutePath.SessionTimedOutPage, element: <div>Logged out</div> }
    ]);
    server.resetHandlers();
  });
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  test.each([['Error', 500]])(
    'Should redirect to %s page on %d',
    async (pageContent: string, status: number) => {
      server.use(
        http.get('test.com/health-checks', () =>
          HttpResponse.text('', { status })
        )
      );

      render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={memoryRouter} />
        </QueryClientProvider>
      );

      const errorText = await screen.findByText(pageContent);
      expect(errorText).toBeInTheDocument();
    }
  );

  test.each([['Error', 500]])(
    'Should redirect to %s page when mutation returns %d',
    async (pageContent: string, status: number) => {
      const user = userEvent.setup();
      server.use(
        http.get('test.com/health-checks', () =>
          HttpResponse.json(
            { healthChecks: [{ questionnaire: {}, id: '12345' }] },
            { status: 200 }
          )
        ),
        http.post(
          'test.com/health-checks/12345/questionnaire',
          () => new HttpResponse(null, { status: status })
        )
      );

      render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={memoryRouter} />
        </QueryClientProvider>
      );

      const button = await screen.findByText('Click me');
      await user.click(button);

      const errorText = await screen.findByText(pageContent);
      expect(errorText).toBeInTheDocument();
    }
  );

  test('Should update cached data', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json(
          { healthChecks: [{ questionnaire: {}, id: '12345' }] },
          { status: 200 }
        )
      ),
      http.post('test.com/health-checks/12345/questionnaire', () =>
        HttpResponse.json(
          {
            updatedHealthCheck: {
              questionnaire: {
                alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost
              },
              id: '12345'
            }
          },
          { status: 200 }
        )
      )
    );

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={memoryRouter} />
      </QueryClientProvider>
    );

    const button = await screen.findByText('Click me');
    await user.click(button);

    await screen.findByText('Mutation success');

    const cachedData = queryClient.getQueryData<IHealthCheck>([
      CacheKeys.HealthCheck
    ]);
    expect(cachedData).toBeTruthy();
    expect(cachedData).toEqual({
      id: '12345',
      questionnaire: {
        alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost
      }
    });
  });
});
