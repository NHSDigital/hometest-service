# HomeTest Frontend

This is a Single Page Application (SPA) built with React and React Router, using Next.js as the build tool.

## Architecture

The application uses a hybrid approach:
- **Client-side routing**: [React Router](https://reactrouter.com/) for all navigation and routing
- **Build tool**: [Next.js](https://nextjs.org) for development server and static export
- **Production**: Static HTML/CSS/JS files served from a CDN or web server

### Key Components

- `src/app.tsx` - Main application entry point with React Router configuration
- `src/routes/` - Page components for each route
- `src/app/[[...slug]]/` - Next.js catch-all route that renders the React Router SPA

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The application uses client-side routing with React Router. You can start editing pages by modifying files in `src/routes/`. The page auto-updates as you edit the file.

## Building for Production

Build the static export:

```bash
npm run build
```

This creates a `build/` directory with static HTML, CSS, and JavaScript files that can be deployed to any static hosting service.

### Serve Static Build Locally

To test the production build locally:

```bash
npm run serve:static
```

This builds the application and serves it at [http://localhost:8085](http://localhost:8085).

## Environment Variables

The application requires the following environment variables:

- `NEXT_PUBLIC_BACKEND_API_ENDPOINT` - The backend API endpoint URL

### Local Development

For local development with the mock server, create a `.env.local` file in the `ui` directory:

```env
NEXT_PUBLIC_BACKEND_API_ENDPOINT=http://localhost:8080
```

This allows the application to communicate with the local WireMock server for API mocking during development.

## Routing
the technologies used in this project:

- [React Router Documentation](https://reactrouter.com/) - Client-side routing library
- [Next.js Documentation](https://nextjs.org/docs) - Build tool and development server
- [React Documentation](https://react.dev/) - UI library
- [NHS UK Frontend](https://nhsuk.github.io/nhsuk-frontend/) - NHS design system components

## Deployment

Since this is a static SPA, you can deploy the built files to any static hosting service:

1. Build the static files: `npm run build`
2. Deploy the `build/` directory to your hosting service (e.g., AWS S3, Azure Static Web Apps, Netlify, Vercel)
3. Configure the hosting service to serve `index.html` for all routes (for client-side routing support)

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```