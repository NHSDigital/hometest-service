use lambda_http::{run, service_fn, Body, Error, Request, Response};
use std::sync::OnceLock;
use stubr::Stubr;

static STUBR_URI: OnceLock<String> = OnceLock::new();
static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

/// Lambda handler — proxies each API Gateway request to the local stubr server
/// after stripping the /mock/supplier, /mock/cognito, and /mock prefixes so
/// that paths match what WireMock JSON stubs expect.
async fn handler(event: Request) -> Result<Response<Body>, Error> {
    let stubr_uri = STUBR_URI.get().expect("stubr not initialised");
    let client = CLIENT.get().expect("reqwest client not initialised");

    // Strip API Gateway path prefixes so stubs match raw paths:
    //   /mock/supplier/oauth/token → /oauth/token
    //   /mock/cognito/.well-known/jwks.json → /.well-known/jwks.json
    //   /mock/postcode/SW1A1AA → /postcode/SW1A1AA
    let original_path = event.uri().path();
    let path = original_path
        .strip_prefix("/mock/supplier")
        .or_else(|| original_path.strip_prefix("/mock/cognito"))
        .or_else(|| original_path.strip_prefix("/mock"))
        .unwrap_or(original_path);
    let path = if path.is_empty() { "/" } else { path };

    tracing::info!(
        method = %event.method(),
        original_path,
        match_path = path,
        "mock-service request"
    );

    // Build forwarded URL (path + query string)
    let mut url = format!("{}{}", stubr_uri, path);
    if let Some(query) = event.uri().query() {
        url.push('?');
        url.push_str(query);
    }

    // Forward the request to stubr
    let mut req = client.request(event.method().clone(), &url);
    for (name, value) in event.headers() {
        req = req.header(name, value);
    }
    req = match event.body() {
        Body::Text(text) => req.body(text.clone()),
        Body::Binary(bytes) => req.body(bytes.clone()),
        Body::Empty => req,
    };

    let resp = req.send().await?;

    // Convert stubr's response back to a Lambda response
    let status = resp.status();
    let resp_headers = resp.headers().clone();
    let body_text = resp.text().await?;

    let mut builder = Response::builder().status(status);
    for (name, value) in &resp_headers {
        builder = builder.header(name, value);
    }
    Ok(builder.body(Body::Text(body_text))?)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .json()
        .without_time()
        .init();

    // Start stubr with the bundled WireMock JSON mapping files.
    // Lambda extracts the zip to /var/task/ so CWD is /var/task/.
    let stubr = Stubr::start("mappings").await;
    tracing::info!(uri = %stubr.uri(), "stubr started with WireMock mappings");

    STUBR_URI.set(stubr.uri().to_string()).ok();
    CLIENT.set(reqwest::Client::new()).ok();

    // Keep stubr alive for the Lambda runtime's lifetime.
    // Leak is intentional — the process is killed when Lambda recycles.
    std::mem::forget(stubr);

    run(service_fn(handler)).await
}
