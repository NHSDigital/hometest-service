---
applyTo: "ui/**"
---

# UI Instructions

## Architecture — Read This First

The UI is **not** a standard Next.js application. Next.js is used only as a static-export
build tool. The entire application is a **React Router SPA** mounted inside a Next.js
catch-all route (`ui/src/app/[[...slug]]/page.tsx`).

```text
Next.js (static shell)
  └── ui/src/app/[[...slug]]/page.tsx  → ClientOnly (dynamic import, ssr: false)
        └── ui/src/app.tsx       → <BrowserRouter> (React Router entry)
              └── ui/src/routes/ → all application routes/pages
```

Consequences:

- **Never** use `next/link`, `next/navigation`, or `useRouter` from Next.js. These do not work
  inside the React Router SPA context.
- **Never** create Next.js API routes (`app/api/` or `pages/api/`). All backend logic lives in
  Lambda functions.
- **Never** use `getServerSideProps`, `getStaticProps`, React Server Components, or any other
  Next.js server-side feature. The app exports as a fully static bundle.
- Always use React Router for navigation: `useNavigate()`, `<Link>` from `react-router-dom`,
  `<Outlet>` for nested layouts.

## Structure

```text
ui/src/
├── app/                  # Next.js shell only — do not add routes here
│   └── [[...slug]]/      # Catch-all static page; mounts the React Router SPA
├── app.tsx               # React Router <BrowserRouter> entry point
├── routes/               # All application pages/route components live here
├── layouts/              # React Router layout components (e.g. JourneyLayout)
├── components/           # Reusable UI components
├── state/                # React Context providers and hooks
├── lib/                  # Utilities, helpers, API client
├── content/              # Static content (strings, copy)
└── hooks/                # Custom React hooks
```

## NHS Frontend Components

Use **`nhsuk-react-components`** for all standard UI elements (buttons, form fields, headers,
error summaries, back links, etc.). Do not create custom implementations of components that
exist in the NHS component library.

```typescript
import { Button, Input, ErrorSummary, BackLink } from "nhsuk-react-components";
```

For custom layouts or spacing not covered by NHS components, use **Tailwind CSS utility
classes**. Never use inline `style={{...}}` props.

## State Management

The application uses React Context for shared state. Providers are composed in layout
components. The existing providers are:

| Provider | File | Purpose |
|---|---|---|
| `JourneyNavigationProvider` | `state/` | Multi-step journey navigation state |
| `CreateOrderProvider` | `state/` | Order creation form state |
| `PostcodeLookupProvider` | `state/` | Postcode lookup state |
| `AuthProvider` | `state/` | NHS Login authentication state |

New providers should follow the same pattern: a context object, a typed interface, and a
`use<Name>` hook that asserts the context is not null.

Wrap providers in a layout component (`layouts/`) rather than adding them ad-hoc inside page
components.

## Data Fetching

All API calls go through **service classes** in `ui/src/lib/services/`. Each service is a
singleton instance (default-exported) that wraps `fetch` directly. The base URL is read from
`@/settings`, which exposes `NEXT_PUBLIC_BACKEND_URL`.

```text
ui/src/lib/services/
├── la-lookup-service.ts       # GET /eligibility-lookup?postcode=
├── order-service.ts           # POST /order
├── order-details-service.ts   # GET /get-order (returns FHIR Bundle)
├── test-results-service.ts    # GET /results (returns FHIR Observation)
└── supplier-service.ts        # client-side metadata only, no HTTP calls
```

```typescript
import { backendUrl } from "@/settings";

class MyService {
  async getData(id: string): Promise<MyResponse> {
    const url = new URL(`${backendUrl}/my-endpoint`);
    url.searchParams.append("id", id);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }
}

const myService = new MyService();
export default myService;
```

Rules:

- Never call `fetch` directly inside a component or hook — always go via a service class.
- Always use `new URL(...)` with `searchParams.append()` for query parameters — never
  interpolate them into URL strings.
- Always generate a `X-Correlation-ID` header (via `crypto.randomUUID()`) on mutating requests.
- For endpoints that return FHIR resources, map the response through a dedicated mapper class
  in `ui/src/lib/mappers/` before returning it to the caller.

When wrapping a service call in a React component, use **TanStack React Query**
(`@tanstack/react-query`) to manage loading, error, and caching state:

```typescript
import { useQuery } from "@tanstack/react-query";
import orderDetailsService from "@/lib/services/order-details-service";

const { data, isLoading, error } = useQuery({
  queryKey: ["order", orderId],
  queryFn: () => orderDetailsService.get(orderId, patient),
});
```

## Form Validation

Use **Zod** for all form/input validation schemas.

```typescript
import { z } from "zod";

export const AddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, "Enter a valid postcode"),
});
```

## Path Aliases

Use the `@/` alias for all imports within `ui/src/`. Never use relative `../../` traversal
when `@/` would be clearer.

```typescript
// Correct
import { CreateOrderProvider } from "@/state";
import { JourneyDevtools } from "@/lib/utils/JourneyDevtools";

// Avoid
import { CreateOrderProvider } from "../../state";
```

## File Naming Conventions

- **Components**: PascalCase `.tsx` — e.g. `EnterDeliveryAddress.tsx`
- **Page/route components**: PascalCase `.tsx` in `routes/`
- **Layout components**: PascalCase `.tsx` in `layouts/`
- **Hooks**: camelCase starting with `use` — e.g. `useJourneyNavigation.ts`
- **Utilities / constants / services**: kebab-case — e.g. `page-title.ts`, `order-details-service.ts`
- **Named exports only** for all non-component modules, **except** service singletons in `ui/src/lib/services/*`, which **default-export** their singleton instance (e.g. `export default orderDetailsService;`).

## Component Rules

- Use **functional components with hooks** only. Never use class components.
- Keep components focused: extract sub-components or hooks rather than growing a single file.
- Do not use `dangerouslySetInnerHTML` unless through an explicit sanitisation wrapper.
- Never use inline `style={{...}}`. Use Tailwind classes or NHS frontend CSS classes. Prioritise NHS classes for spacing, typography, and layout where possible.
- Always provide accessible labels for interactive elements.

## Testing Requirements

Every new React component and every route/page component must have a co-located unit test:

- **Location**: `ui/src/__tests__/` or co-located alongside the component.
- **Tools**: Jest 30 + React Testing Library 16.
- **Setup**: test utilities are configured in `jest.setup.ts`.

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders the heading", () => {
    render(
      <MemoryRouter>
        <MyComponent />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Expected heading" })).toBeInTheDocument();
  });
});
```

Wrap components that use React Router hooks in `<MemoryRouter>` in tests. Wrap components
that consume Context providers with the relevant provider in tests.
