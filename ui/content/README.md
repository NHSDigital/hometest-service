# Content Management System (CMS)

This folder contains a lightweight, build-time JSON CMS for managing static content across the application. All user-facing text is centralised here, making it easy to update content without modifying React components.

## Overview

- **Build-time only**: Content is bundled at build time—no runtime fetching
- **Type-safe**: All content is validated against TypeScript schemas
- **Route-based keys**: Page content keys match their route names (e.g., `get-self-test-kit-for-HIV`)

## File Structure

```
content/
├── content.json          # All content lives here
├── schema.ts             # TypeScript type definitions
├── ContentService.ts     # Singleton service for accessing content
├── ContentValidator.ts   # Validation functions
├── index.ts              # Barrel exports
└── __tests__/            # Unit tests
```

## Quick Start

### Using Content in a Component

```tsx
import { useContent } from "@/hooks";

export default function MyPage() {
  const { commonContent, "get-self-test-kit-for-HIV": content } = useContent();

  return (
    <div>
      <h1>{content.title}</h1>
      <button>{commonContent.navigation.continue}</button>
    </div>
  );
}
```

### Alternative: Get Specific Page Content

```tsx
import { usePageContent } from "@/hooks";

export default function MyPage() {
  const content = usePageContent("enter-delivery-address");

  return <h1>{content.title}</h1>;
}
```

## Content Structure

### `content.json`

The JSON file has two main sections:

```json
{
  "commonContent": { ... },  // Shared across all pages
  "pages": { ... }           // Page-specific content
}
```

### Common Content

Shared content used across multiple pages:

| Key | Purpose |
|-----|---------|
| `navigation` | Back/Continue button labels |
| `validation` | Form validation error messages |
| `links` | External NHS links (sexual health clinic, A&E) |
| `errorSummary` | Error summary component text |

Example:
```json
{
  "commonContent": {
    "navigation": {
      "back": "Back",
      "continue": "Continue"
    },
    "validation": {
      "postcode": {
        "required": "Enter a full UK postcode",
        "maxLength": "Postcode must be 8 characters or less",
        "invalid": "Enter a postcode using letters and numbers"
      }
    }
  }
}
```

### Pages Content

Each page has its own content object, keyed by route name:

| Key | Route |
|-----|-------|
| `get-self-test-kit-for-HIV` | `/get-self-test-kit-for-HIV` |
| `enter-delivery-address` | `/enter-delivery-address` |
| `enter-address-manually` | `/enter-address-manually` |
| `no-address-found` | `/no-address-found` |

## How to Change Content

### 1. Edit Existing Text

Simply update the value in `content.json`:

```json
{
  "pages": {
    "get-self-test-kit-for-HIV": {
      "title": "Get a self-test kit for HIV"  // ← Change this text
    }
  }
}
```

### 2. Add a New Field to an Existing Page

**Step 1:** Add the field to `content.json`:

```json
{
  "pages": {
    "enter-delivery-address": {
      "title": "...",
      "newField": "Your new content here"  // ← Add new field
    }
  }
}
```

**Step 2:** Update the TypeScript schema in `schema.ts`:

```ts
export interface EnterDeliveryAddressContent {
  title: string;
  newField: string;  // ← Add type definition
  // ...
}
```

**Step 3:** Use it in your component:

```tsx
const { "enter-delivery-address": content } = useContent();
return <p>{content.newField}</p>;
```

### 3. Add a New Page

**Step 1:** Add the page content to `content.json`:

```json
{
  "pages": {
    "my-new-page": {
      "title": "My New Page",
      "description": "Page description here"
    }
  }
}
```

**Step 2:** Create the interface in `schema.ts`:

```ts
export interface MyNewPageContent {
  title: string;
  description: string;
}
```

**Step 3:** Add to `PagesContent` interface in `schema.ts`:

```ts
export interface PagesContent {
  // ... existing pages
  "my-new-page": MyNewPageContent;
}
```

**Step 4:** Update `ContentValidator.ts` - add to `REQUIRED_PAGE_KEYS`:

```ts
const REQUIRED_PAGE_KEYS: (keyof PagesContent)[] = [
  // ... existing keys
  "my-new-page",
];
```

**Step 5:** Update `useContent.ts` hook:

```ts
// Add to UseContentReturn interface
export interface UseContentReturn {
  // ... existing
  "my-new-page": MyNewPageContent;
}

// Add to return object
export const useContent = (): UseContentReturn => {
  return {
    // ... existing
    "my-new-page": content.pages["my-new-page"],
  };
};

// Add function overload
export function usePageContent(page: "my-new-page"): MyNewPageContent;
```

**Step 6:** Export the type from `index.ts`:

```ts
export type { MyNewPageContent } from "./schema";
```

## Validation

Content is validated at build time. The validator checks:

- Required top-level keys (`commonContent`, `pages`)
- Required page keys exist
- Each page has a `title` field
- Navigation has `back` and `continue` strings

### Running Validation Manually

```ts
import { validateContent, assertValidContent } from "@/content";
import contentData from "@/content/content.json";

// Returns { valid: boolean, errors: string[] }
const result = validateContent(contentData);

// Throws if invalid
assertValidContent(contentData);
```

## Best Practices

### DO ✅

- Keep content keys descriptive and consistent
- Use nested objects for related content (e.g., `form.postcodeLabel`)
- Include all static text, including labels, hints, and error messages
- Run tests after changing content structure

### DON'T ❌

- Don't include dynamic values that change at runtime
- Don't add HTML markup in content strings (use components instead)
- Don't duplicate content—use `commonContent` for shared text
- Don't forget to update the schema when adding fields

## Testing

Run content-related tests:

```bash
npm test -- --testPathPatterns="(ContentService|ContentValidator|useContent)" --no-coverage
```

### When to Update Tests

| Change Type | Tests to Update |
|-------------|-----------------|
| Edit existing text | No test changes needed |
| Add new field to existing page | No test changes needed (unless testing specific values) |
| Add new page | All three test files (see below) |
| Rename a page key | All three test files |

### Adding Tests for a New Page

When you add a new page to the CMS, update these test files:

**1. `content/__tests__/ContentService.test.ts`**

Add the new page to the "should have all required pages" test:

```ts
it("should have all required pages", () => {
  expect(content.pages["my-new-page"]).toBeDefined();  // ← Add this
});
```

Add a test for `getPageContent`:

```ts
it("should return my-new-page content", () => {
  const page = getPageContent("my-new-page");
  expect(page.title).toBe("My New Page Title");
});
```

**2. `content/__tests__/ContentValidator.test.ts`**

Update all mock content objects to include the new page key:

```ts
const result = validateContent({
  commonContent: { /* ... */ },
  pages: {
    "get-self-test-kit-for-HIV": { title: "Test" },
    "enter-delivery-address": { title: "Test" },
    "enter-address-manually": { title: "Test" },
    "no-address-found": { title: "Test" },
    "my-new-page": { title: "Test" },  // ← Add to ALL test cases
  },
});
```

**3. `hooks/__tests__/useContent.test.ts`**

Add to the "should return all content sections" test:

```ts
it("should return all content sections", () => {
  const { result } = renderHook(() => useContent());
  expect(result.current["my-new-page"]).toBeDefined();  // ← Add this
});
```

Add a `usePageContent` test:

```ts
it("should return my-new-page content", () => {
  const { result } = renderHook(() => usePageContent("my-new-page"));
  expect(result.current.title).toBe("My New Page Title");
});
```

### Running All Tests

Always run the full test suite after content structure changes:

```bash
npm test
```

## Troubleshooting

### TypeScript Error: Property doesn't exist

You've added content to `content.json` but not updated `schema.ts`. Add the property to the relevant interface.

### Content not updating

The content is bundled at build time. If running in dev mode, the hot reload should pick up changes. If not, restart the dev server.

### Validation errors

Check the console output—validation errors list exactly which keys are missing or malformed.
