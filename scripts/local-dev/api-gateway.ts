/**
 * Local API Gateway - Express server that wraps Lambda handlers
 * This allows running the backend locally without AWS
 *
 * Run with: npx ts-node scripts/local-dev/api-gateway.ts
 * 
 * HTTPS mode (for custom domain testing):
 *   HTTPS=true npx ts-node scripts/local-dev/api-gateway.ts
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 4000;
const HTTPS_PORT = 4443;
const USE_HTTPS = process.env.HTTPS === 'true';

// Middleware
app.use(cors({
  origin: true, // Allow all origins for local development
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Set environment variables for local development
process.env.AWS_REGION = 'eu-west-2';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
process.env.ENV_NAME = 'local';
process.env.AUTH_COOKIE_SAME_SITE = 'None';
process.env.AUTH_COOKIE_SECURE = 'true';

// ============================================================================
// Mock NHS Login endpoints (replicating nhc-mocks-stack behavior)
// ============================================================================

// NHS Login - Authorize endpoint
app.get('/mock/nhs-login/authorize', (req: Request, res: Response) => {
  const { redirect_uri, state } = req.query;
  const mockCode = `mock_auth_code_${uuidv4()}`;

  // Redirect back to the app with a mock authorization code
  const redirectUrl = `${redirect_uri}?code=${mockCode}&state=${state}`;
  res.redirect(redirectUrl);
});

// NHS Login - Token endpoint
app.post('/mock/nhs-login/token', (_req: Request, res: Response) => {
  // Return mock tokens
  const mockIdToken = Buffer.from(JSON.stringify({
    sub: 'mock-user-id',
    nhs_number: '9999999999',
    given_name: 'Test',
    family_name: 'User',
    birthdate: '1990-01-01',
    email: 'test.user@example.com',
    email_verified: true,
    identity_proofing_level: 'P9'
  })).toString('base64');

  res.json({
    access_token: `mock_access_token_${uuidv4()}`,
    token_type: 'Bearer',
    expires_in: 3600,
    id_token: `eyJhbGciOiJSUzI1NiJ9.${mockIdToken}.mock_signature`,
    refresh_token: `mock_refresh_token_${uuidv4()}`
  });
});

// NHS Login - UserInfo endpoint
app.get('/mock/nhs-login/userinfo', (_req: Request, res: Response) => {
  res.json({
    sub: 'mock-user-id',
    nhs_number: '9999999999',
    given_name: 'Test',
    family_name: 'User',
    birthdate: '1990-01-01',
    email: 'test.user@example.com',
    email_verified: true,
    phone_number: '+447123456789',
    phone_number_verified: true,
    identity_proofing_level: 'P9',
    gp_integration_credentials: {
      gp_user_id: 'mock-gp-user-id',
      gp_ods_code: 'A12345'
    }
  });
});

// NHS Login - JWKS endpoint
app.get('/mock/nhs-login/.well-known/jwks.json', (_req: Request, res: Response) => {
  res.json({
    keys: [{
      kty: 'RSA',
      kid: 'mock-key-id',
      use: 'sig',
      alg: 'RS256',
      n: 'mock-modulus',
      e: 'AQAB'
    }]
  });
});

// ============================================================================
// Mock NHS App endpoint
// ============================================================================

app.get('/mock/nhs-app/redirect', (_req: Request, res: Response) => {
  res.json({ message: 'NHS App redirect mock' });
});

// ============================================================================
// Backend API endpoints (matching nhc-backend-stack routes)
// ============================================================================

// POST /login - Login callback
app.post('/login', (req: Request, res: Response) => {
  try {
    const sessionId = uuidv4();
    res.cookie('nht_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000
    });
    res.json({
      success: true,
      patient: {
        nhsNumber: '9999999999',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        email: 'test.user@example.com'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout - Logout
app.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('nht_session');
  res.json({ success: true });
});

// POST /refresh-token - Refresh token
app.post('/refresh-token', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// GET /patient - Get patient info
app.get('/patient', (_req: Request, res: Response) => {
  res.json({
    nhsNumber: '9999999999',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    email: 'test.user@example.com',
    phoneNumber: '+447123456789',
    address: {
      line1: '123 Test Street',
      line2: '',
      city: 'London',
      postcode: 'SW1A 1AA'
    },
    gpPractice: {
      odsCode: 'A12345',
      name: 'Test GP Surgery'
    }
  });
});

// POST /patient - Update patient info
app.post('/patient', (req: Request, res: Response) => {
  res.json({
    success: true,
    patient: req.body
  });
});

// GET /address - Address lookup
app.get('/address', (req: Request, res: Response) => {
  const { postcode } = req.query;
  res.json({
    addresses: [
      {
        line1: '1 Example Road',
        line2: '',
        city: 'London',
        postcode: postcode || 'SW1A 1AA'
      },
      {
        line1: '2 Example Road',
        line2: '',
        city: 'London',
        postcode: postcode || 'SW1A 1AA'
      }
    ]
  });
});

// POST /hometest - Initiate test
app.post('/hometest', (_req: Request, res: Response) => {
  const testId = uuidv4();
  res.json({
    id: testId,
    nhsNumber: '9999999999',
    step: 'INIT',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    dataModelVersion: '1.0.0'
  });
});

// GET /hometest - Get all tests
app.get('/hometest', (_req: Request, res: Response) => {
  res.json({
    tests: []
  });
});

// GET /hometest/:id - Get single test
app.get('/hometest/:id', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    nhsNumber: '9999999999',
    step: 'INIT',
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    dataModelVersion: '1.0.0',
    questionnaire: {}
  });
});

// POST /hometest/:id/version - Test version migration
app.post('/hometest/:id/version', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    migrated: true,
    dataModelVersion: '1.0.0'
  });
});

// POST /hometest/:id/schedule-gp-update - Schedule GP update
app.post('/hometest/:id/schedule-gp-update', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    scheduled: true
  });
});

// POST /hometest/:id/questionnaire - Update questionnaire
app.post('/hometest/:id/questionnaire', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    step: 'INIT',
    status: 'IN_PROGRESS',
    questionnaire: req.body
  });
});

// POST /hometest/:id/questionnaire/submit - Submit questionnaire
app.post('/hometest/:id/questionnaire/submit', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    step: 'QUESTIONNAIRE_COMPLETED',
    status: 'IN_PROGRESS'
  });
});

// POST /hometest/:id/order - Place test order
app.post('/hometest/:id/order', (req: Request, res: Response) => {
  const orderId = uuidv4();
  res.json({
    id: req.params.id,
    orderId: orderId,
    orderDetails: req.body,
    status: 'ORDERED',
    orderedAt: new Date().toISOString()
  });
});

// POST /events - Event audit
app.post('/events', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// GET /rum-identity - RUM identity (CloudWatch Real User Monitoring)
// For local dev, return 503 to signal RUM is unavailable
app.get('/rum-identity', (_req: Request, res: Response) => {
  res.status(503).json({
    error: 'RUM not available in local development',
    message: 'CloudWatch RUM is disabled for local development'
  });
});

// GET /.well-known/jwks.json - JWKS endpoint
app.get('/.well-known/jwks.json', (_req: Request, res: Response) => {
  res.json({
    keys: [{
      kty: 'RSA',
      kid: 'mock-key-id',
      use: 'sig',
      alg: 'RS256',
      n: 'mock-modulus',
      e: 'AQAB'
    }]
  });
});

// Health check endpoint for the API itself
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Catch-all for unhandled routes
app.use('*', (req: Request, res: Response) => {
  console.warn(`⚠️ Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = () => {
  const httpPort = PORT;
  
  // Always start HTTP server
  app.listen(httpPort, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         NHS Home Testing - Local API Gateway                   ║
╠════════════════════════════════════════════════════════════════╣
║  🚀 HTTP Server:       http://localhost:${httpPort}                   ║
║  📊 DynamoDB Admin:    http://localhost:8001                   ║
║  🔐 Mock NHS Login:    http://localhost:${httpPort}/mock/nhs-login    ║
╠════════════════════════════════════════════════════════════════╣
║  Backend API endpoints (matching nhc-backend-stack):           ║
║    POST /login                          - Login callback       ║
║    POST /logout                         - Logout               ║
║    POST /refresh-token                  - Refresh token        ║
║    GET  /patient                        - Get patient info     ║
║    POST /patient                        - Update patient info  ║
║    GET  /address                        - Address lookup       ║
║    POST /hometest                       - Initiate test        ║
║    GET  /hometest                       - List tests           ║
║    GET  /hometest/:id                   - Get test             ║
║    POST /hometest/:id/version           - Version migration    ║
║    POST /hometest/:id/schedule-gp-update                       ║
║    POST /hometest/:id/questionnaire                            ║
║    POST /hometest/:id/questionnaire/submit                     ║
║    POST /hometest/:id/order             - Place test order     ║
║    POST /events                         - Event audit          ║
║    GET  /rum-identity                   - RUM identity         ║
║    GET  /.well-known/jwks.json          - JWKS endpoint        ║
║    GET  /health                         - API health check     ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });

  // Optionally start HTTPS server for custom domain testing
  if (USE_HTTPS) {
    const certsDir = path.join(__dirname, 'certs');
    const keyPath = path.join(certsDir, 'key.pem');
    const certPath = path.join(certsDir, 'cert.pem');

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  HTTPS certificates not found!                             ║
║                                                                ║
║  Generate self-signed certificates with:                       ║
║                                                                ║
║  mkdir -p scripts/local-dev/certs                              ║
║  openssl req -x509 -newkey rsa:4096 -keyout \\                  ║
║    scripts/local-dev/certs/key.pem -out \\                      ║
║    scripts/local-dev/certs/cert.pem -days 365 -nodes \\         ║
║    -subj "/CN=local-api.nhttest.org"                           ║
╚════════════════════════════════════════════════════════════════╝
      `);
    } else {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };

      https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🔒 HTTPS Server:      https://localhost:${HTTPS_PORT}                 ║
║                                                                ║
║  For custom domain (e.g., local-api.nhttest.org):              ║
║    1. Add to /etc/hosts: 127.0.0.1 local-api.nhttest.org       ║
║    2. Configure reverse proxy or port forward ${HTTPS_PORT} to 443    ║
╚════════════════════════════════════════════════════════════════╝
        `);
      });
    }
  }
};

startServer();
