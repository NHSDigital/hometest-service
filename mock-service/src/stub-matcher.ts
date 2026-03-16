import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * WireMock-compatible stub matcher.
 *
 * Loads JSON mapping files and matches incoming requests using the same
 * rules as WireMock: method, urlPath/urlPathPattern, headers,
 * queryParameters, bodyPatterns, and priority ordering.
 *
 * Supported matching operators:
 *   - equalTo, contains, matches (regex)
 *   - absent (true = param must not be present)
 *   - matchesJsonPath with expression + absent
 */

// ---------- Types ----------

export interface WireMockMapping {
  priority: number;
  request: WireMockRequest;
  response: WireMockResponse;
}

interface WireMockRequest {
  method?: string;
  urlPath?: string;
  urlPathPattern?: string;
  headers?: Record<string, MatcherDef>;
  queryParameters?: Record<string, MatcherDef>;
  bodyPatterns?: BodyPattern[];
}

interface WireMockResponse {
  status?: number;
  headers?: Record<string, string>;
  jsonBody?: unknown;
  body?: string;
}

type MatcherDef = {
  equalTo?: string;
  contains?: string;
  matches?: string;
  absent?: boolean;
  caseInsensitive?: boolean;
};

type BodyPattern = {
  equalTo?: string;
  contains?: string;
  matches?: string;
  matchesJsonPath?: JsonPathMatcher | string;
};

type JsonPathMatcher = {
  expression: string;
  absent?: boolean;
};

export interface IncomingRequest {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  queryParameters: Record<string, string | undefined>;
  body: string;
}

// ---------- Loading ----------

const MAPPINGS_DIR = join(__dirname, "mappings");

export function loadMappings(): WireMockMapping[] {
  let files: string[];
  try {
    files = readdirSync(MAPPINGS_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    console.warn(`No mappings directory found at ${MAPPINGS_DIR}`);
    return [];
  }

  const mappings: WireMockMapping[] = files.map((file) => {
    const raw = readFileSync(join(MAPPINGS_DIR, file), "utf-8");
    const mapping = JSON.parse(raw) as Partial<WireMockMapping>;
    return {
      priority: mapping.priority ?? 0,
      request: mapping.request ?? {},
      response: mapping.response ?? { status: 200 },
    };
  });

  // Sort by priority ascending (lower number = higher priority, matched first)
  mappings.sort((a, b) => a.priority - b.priority);

  console.log(`Loaded ${mappings.length} WireMock mappings`);
  return mappings;
}

// ---------- Matching ----------

export function matchRequest(
  mappings: WireMockMapping[],
  req: IncomingRequest,
): WireMockMapping | undefined {
  return mappings.find((mapping) => isMatch(mapping.request, req));
}

function isMatch(spec: WireMockRequest, req: IncomingRequest): boolean {
  // Method
  if (spec.method && spec.method.toUpperCase() !== req.method.toUpperCase()) {
    return false;
  }

  // URL path — exact match
  if (spec.urlPath && spec.urlPath !== req.path) {
    return false;
  }

  // URL path — regex match
  if (spec.urlPathPattern) {
    try {
      if (!new RegExp(spec.urlPathPattern).test(req.path)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Headers
  if (spec.headers) {
    for (const [name, matcher] of Object.entries(spec.headers)) {
      // Header lookup is case-insensitive
      const actualValue = findHeader(req.headers, name);
      if (!matchValue(matcher, actualValue)) {
        return false;
      }
    }
  }

  // Query parameters
  if (spec.queryParameters) {
    for (const [name, matcher] of Object.entries(spec.queryParameters)) {
      const actualValue = req.queryParameters[name] ?? undefined;
      if (!matchValue(matcher, actualValue)) {
        return false;
      }
    }
  }

  // Body patterns
  if (spec.bodyPatterns) {
    for (const pattern of spec.bodyPatterns) {
      if (!matchBody(pattern, req.body)) {
        return false;
      }
    }
  }

  return true;
}

// ---------- Value matchers ----------

function matchValue(matcher: MatcherDef, value: string | undefined): boolean {
  // absent check
  if (matcher.absent === true) {
    return value === undefined || value === null;
  }
  if (matcher.absent === false) {
    return value !== undefined && value !== null;
  }

  // If the value is missing but matcher expects something, no match
  if (value === undefined || value === null) {
    return false;
  }

  const caseInsensitive = matcher.caseInsensitive === true;
  const v = caseInsensitive ? value.toLowerCase() : value;

  if (matcher.equalTo !== undefined) {
    const expected = caseInsensitive ? matcher.equalTo.toLowerCase() : matcher.equalTo;
    return v === expected;
  }

  if (matcher.contains !== undefined) {
    const expected = caseInsensitive ? matcher.contains.toLowerCase() : matcher.contains;
    return v.includes(expected);
  }

  if (matcher.matches !== undefined) {
    try {
      const flags = caseInsensitive ? "i" : undefined;
      return new RegExp(matcher.matches, flags).test(value);
    } catch {
      return false;
    }
  }

  return true;
}

// ---------- Body matchers ----------

function matchBody(pattern: BodyPattern, body: string): boolean {
  if (pattern.equalTo !== undefined) {
    return body === pattern.equalTo;
  }

  if (pattern.contains !== undefined) {
    return body.includes(pattern.contains);
  }

  if (pattern.matches !== undefined) {
    try {
      return new RegExp(pattern.matches).test(body);
    } catch {
      return false;
    }
  }

  if (pattern.matchesJsonPath !== undefined) {
    return matchJsonPath(pattern.matchesJsonPath, body);
  }

  return true;
}

// ---------- Simplified JSONPath matcher ----------

function matchJsonPath(
  matcher: JsonPathMatcher | string,
  body: string,
): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return false;
  }

  if (typeof matcher === "string") {
    // Simple JSONPath expression — just check if the path resolves to something
    const value = resolveJsonPath(parsed, matcher);
    return value !== undefined;
  }

  // Object form with expression + absent
  const value = resolveJsonPath(parsed, matcher.expression);

  if (matcher.absent === true) {
    return value === undefined;
  }

  return value !== undefined;
}

/**
 * Minimal JSONPath resolver — supports dot-notation paths like `$.subject`, `$.code.coding[0].code`.
 * This isn't a full JSONPath implementation but covers the patterns used in the stubs.
 */
function resolveJsonPath(obj: unknown, expression: string): unknown {
  // Strip leading $. prefix
  const path = expression.replace(/^\$\.?/, "");
  if (!path) return obj;

  const segments = path.split(/\.|\[|\]/).filter(Boolean);
  let current: unknown = obj;

  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }

  return current;
}

// ---------- Helpers ----------

function findHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  // Case-insensitive header lookup
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return undefined;
}
