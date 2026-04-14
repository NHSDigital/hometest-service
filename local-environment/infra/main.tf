terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    apigateway     = "http://localhost:4566"
    iam            = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    s3             = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    sqs            = "http://localhost:4566"
  }
}

# Secrets from JSON files
locals {
  secrets_dir       = "${path.module}/resources/secrets"
  secret_json_files = fileset(local.secrets_dir, "*.json")
  secret_txt_files  = fileset(local.secrets_dir, "*.txt")
  secret_key_files  = fileset(local.secrets_dir, "*.pem")

  # Required secrets that must exist
  required_secrets = [
    "nhs-login-private-key.pem"
  ]

  # Validate required secrets exist
  missing_secrets = [
    for secret in local.required_secrets :
    secret if !fileexists("${local.secrets_dir}/${secret}")
  ]

  secret_json_map = {
    for f in local.secret_json_files :
    trimsuffix(f, ".json") => f
  }
  secret_txt_map = {
    for f in local.secret_txt_files :
    trimsuffix(f, ".txt") => f
  }
  secret_key_map = {
    for f in local.secret_key_files :
    trimsuffix(f, ".pem") => f
  }

  secret_file_map = merge(local.secret_json_map, local.secret_txt_map, local.secret_key_map)
}

locals {
  wiremock_container_base_url    = "http://wiremock:8080"
  wiremock_browser_base_url      = "http://localhost:8080"
  nhs_login_sandpit_base_url     = "https://auth.sandpit.signin.nhs.uk"
  postcode_lookup_os_places_base = "https://api.os.uk/search/places/v1"

  use_wiremock_mode = var.local_service_mode == "wiremock"

  resolved_nhs_login_override_container_base_url = var.local_use_ui_auth_url_override != null ? replace(var.local_use_ui_auth_url_override, "localhost", "wiremock") : null
  resolved_nhs_login_override_browser_base_url   = var.local_use_ui_auth_url_override != null ? replace(var.local_use_ui_auth_url_override, "wiremock", "localhost") : null

  resolved_nhs_login_base_url = local.resolved_nhs_login_override_container_base_url != null ? local.resolved_nhs_login_override_container_base_url : (
    local.use_wiremock_mode ? local.wiremock_container_base_url : local.nhs_login_sandpit_base_url
  )

  resolved_nhs_login_authorize_url = local.resolved_nhs_login_override_browser_base_url != null ? "${local.resolved_nhs_login_override_browser_base_url}/authorize" : (
    local.use_wiremock_mode ? "${local.wiremock_browser_base_url}/authorize" : "${local.nhs_login_sandpit_base_url}/authorize"
  )

  resolved_postcode_lookup_base_url = var.local_postcode_lookup_base_url_override != null ? var.local_postcode_lookup_base_url_override : (
    local.use_wiremock_mode ? local.wiremock_container_base_url : local.postcode_lookup_os_places_base
  )

  resolved_supplier_service_url = var.local_supplier_service_url_override != null ? var.local_supplier_service_url_override : local.wiremock_container_base_url

  resolved_use_wiremock_auth = local.resolved_nhs_login_override_container_base_url != null ? length(regexall("wiremock", lower(local.resolved_nhs_login_override_container_base_url))) > 0 : local.use_wiremock_mode

  # Common DB environment variables shared across multiple lambdas
  common_db_env = {
    DB_USERNAME    = "app_user"
    DB_ADDRESS     = "postgres-db"
    DB_PORT        = "5432"
    DB_NAME        = "local_hometest_db"
    DB_SCHEMA      = "hometest"
    DB_SECRET_NAME = "postgres-db-password"
    DB_SSL         = "false"
  }

  # Common base env for all lambdas
  common_base_env = {
    NODE_OPTIONS = "--enable-source-maps"
    ALLOW_ORIGIN = "http://localhost:3000"
  }

  # Common CORS settings shared across multiple lambdas
  common_cors = {
    enable_cors            = true
    cors_allow_origin      = "http://localhost:3000"
    cors_allow_credentials = true
  }

  # Common lambda module parameters
  common_lambda_params = {
    project_name                 = var.project_name
    lambda_role_arn              = aws_iam_role.lambda_role.arn
    environment                  = var.environment
    aws_region                   = var.aws_region
    api_gateway_id               = aws_api_gateway_rest_api.api.id
    api_gateway_root_resource_id = aws_api_gateway_rest_api.api.root_resource_id
    api_gateway_execution_arn    = aws_api_gateway_rest_api.api.execution_arn
  }
}

# Fail early if required secrets are missing
resource "null_resource" "validate_secrets" {
  lifecycle {
    precondition {
      condition     = length(local.missing_secrets) == 0
      error_message = <<-EOT
        Missing required secret files in ${local.secrets_dir}:
        ${join("\n  - ", local.missing_secrets)}
      EOT
    }
  }
}



resource "aws_secretsmanager_secret" "secrets" {
  for_each = local.secret_file_map
  name     = each.key
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each      = local.secret_file_map
  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = file("${local.secrets_dir}/${each.value}")
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy" "lambda_secrets_read" {
  name = "${var.project_name}-lambda-secrets-read"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambdas_sqs_publish" {
  name = "${var.project_name}-lambdas-sqs-publish"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.order_placement.arn
      }
    ]
  })
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api"
  description = "API Gateway for ${var.project_name}"
}

# Eligibility Lookup Lambda
module "eligibility_lookup_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "eligibility-lookup-lambda"
  zip_path                     = "${path.module}/../../lambdas/dist/eligibility-lookup-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "eligibility-lookup"
  http_method                  = "GET"

  enable_cors            = local.common_cors.enable_cors
  cors_allow_origin      = local.common_cors.cors_allow_origin
  cors_allow_methods     = ["GET", "OPTIONS"]
  cors_allow_headers     = ["Content-Type", "Authorization"]
  cors_allow_credentials = local.common_cors.cors_allow_credentials

  environment_variables = merge(local.common_base_env, local.common_db_env)
}

# Login Lambda
module "login_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "login"
  zip_path                     = "${path.module}/../../lambdas/dist/login-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "login"
  http_method                  = "POST"
  timeout                      = 30

  enable_cors            = local.common_cors.enable_cors
  cors_allow_origin      = local.common_cors.cors_allow_origin
  cors_allow_methods     = ["POST", "OPTIONS"]
  cors_allow_headers     = ["Content-Type", "Authorization"]
  cors_allow_credentials = local.common_cors.cors_allow_credentials

  environment_variables = merge(local.common_base_env, {
    NHS_LOGIN_BASE_ENDPOINT_URL                = local.resolved_nhs_login_base_url,
    NHS_LOGIN_CLIENT_ID                        = "hometest",
    NHS_LOGIN_REDIRECT_URL                     = "http://localhost:3000/callback",
    NHS_LOGIN_PRIVATE_KEY_SECRET_NAME          = "nhs-login-private-key",
    AUTH_SESSION_MAX_DURATION_MINUTES          = "60",
    AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES  = "60",
    AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES = "60",
    AUTH_COOKIE_SAME_SITE                      = "Lax"
    AUTH_COOKIE_SECURE                         = "false"
  })
}

module "session_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "session"
  zip_path                     = "${path.module}/../../lambdas/dist/session-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "session"
  http_method                  = "GET"

  enable_cors            = local.common_cors.enable_cors
  cors_allow_origin      = local.common_cors.cors_allow_origin
  cors_allow_methods     = ["GET", "OPTIONS"]
  cors_allow_headers     = ["Content-Type", "Authorization"]
  cors_allow_credentials = local.common_cors.cors_allow_credentials

  environment_variables = merge(local.common_base_env, {
    AUTH_COOKIE_KEY_ID                 = "key"
    AUTH_COOKIE_PUBLIC_KEY_SECRET_NAME = "nhs-login-private-key"
    NHS_LOGIN_BASE_ENDPOINT_URL        = local.resolved_nhs_login_base_url,
  })
}

# Postcode Lookup Lambda
module "postcode_lookup_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "postcode-lookup"
  zip_path                     = "${path.module}/../../lambdas/dist/postcode-lookup-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "postcode-lookup"
  http_method                  = "GET"

  environment_variables = merge(local.common_base_env, {
    POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME = "os-places-creds",
    POSTCODE_LOOKUP_BASE_URL                = local.resolved_postcode_lookup_base_url,
    POSTCODE_LOOKUP_TIMEOUT_MS              = "5000",
    POSTCODE_LOOKUP_MAX_RETRIES             = "3",
    POSTCODE_LOOKUP_RETRY_DELAY_MS          = "1000",
    POSTCODE_LOOKUP_RETRY_BACKOFF_FACTOR    = "2",
    USE_STUB_POSTCODE_CLIENT                = false,
  })
}

module "hello_world_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "hello-world"
  zip_path                     = "${path.module}/../../lambdas/dist/hello-world-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "hello-world"

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
  }
}

resource "aws_sqs_queue" "order_placement" {
  name = "${var.project_name}-order-placement"
}

resource "aws_sqs_queue" "notify_messages" {
  name = "${var.project_name}-notify-messages"
}

module "order_router_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "order-router"
  zip_path                     = "${path.module}/../../lambdas/dist/order-router-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "test-order/order"

  environment_variables = merge(local.common_db_env, {
    NODE_OPTIONS = "--enable-source-maps"
  })
}

resource "aws_lambda_event_source_mapping" "order_router_order_placement" {
  event_source_arn = aws_sqs_queue.order_placement.arn
  function_name    = module.order_router_lambda.lambda_function.arn
  enabled          = true
  batch_size       = 1
}

module "order_result_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "order-result"
  zip_path                     = "${path.module}/../../lambdas/dist/order-result-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "result"
  http_method                  = "POST"

  environment_variables = merge(local.common_base_env, local.common_db_env, {
    NOTIFY_MESSAGES_QUEUE_URL = aws_sqs_queue.notify_messages.url
    HOME_TEST_BASE_URL        = "http://localhost:3000"
  })
}

module "order_service_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "order-service"
  zip_path                     = "${path.module}/../../lambdas/dist/order-service-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "order"
  http_method                  = "POST"

  enable_cors            = local.common_cors.enable_cors
  cors_allow_origin      = local.common_cors.cors_allow_origin
  cors_allow_methods     = ["POST", "OPTIONS"]
  cors_allow_headers     = ["Content-Type", "Authorization", "X-Correlation-ID"]
  cors_allow_credentials = local.common_cors.cors_allow_credentials

  environment_variables = merge(local.common_base_env, local.common_db_env, {
    ORDER_PLACEMENT_QUEUE_URL = aws_sqs_queue.order_placement.url
  })
}

module "get_order_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "get-order"
  zip_path                     = "${path.module}/../../lambdas/dist/get-order-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "get-order"
  http_method                  = "GET"

  enable_cors        = local.common_cors.enable_cors
  cors_allow_origin  = local.common_cors.cors_allow_origin
  cors_allow_methods = ["GET", "OPTIONS"]

  environment_variables = merge(local.common_base_env, local.common_db_env)
}

module "get_results_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "get-results"
  zip_path                     = "${path.module}/../../lambdas/dist/get-results-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "results"
  http_method                  = "GET"

  enable_cors        = local.common_cors.enable_cors
  cors_allow_origin  = local.common_cors.cors_allow_origin
  cors_allow_methods = ["GET", "OPTIONS"]
  cors_allow_headers = ["Content-Type", "Authorization", "X-Requested-With", "X-Correlation-ID"]

  environment_variables = merge(local.common_base_env, local.common_db_env)
}

module "order_status_lambda" {
  source = "./modules/lambda"

  project_name                 = local.common_lambda_params.project_name
  aws_region                   = local.common_lambda_params.aws_region
  function_name                = "order-status"
  zip_path                     = "${path.module}/../../lambdas/dist/order-status-lambda.zip"
  lambda_role_arn              = local.common_lambda_params.lambda_role_arn
  environment                  = local.common_lambda_params.environment
  api_gateway_id               = local.common_lambda_params.api_gateway_id
  api_gateway_root_resource_id = local.common_lambda_params.api_gateway_root_resource_id
  api_gateway_execution_arn    = local.common_lambda_params.api_gateway_execution_arn
  api_path                     = "test-order/status"
  http_method                  = "POST"

  environment_variables = merge(local.common_base_env, local.common_db_env, {
    NOTIFY_MESSAGES_QUEUE_URL = aws_sqs_queue.notify_messages.url
    HOME_TEST_BASE_URL        = "http://localhost:3000"
  })
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  depends_on = [
    module.eligibility_lookup_lambda,
    module.order_result_lambda,
    module.get_order_lambda,
    module.get_results_lambda,
    module.login_lambda,
    module.order_service_lambda,
    module.session_lambda,
    module.order_status_lambda,
    module.postcode_lookup_lambda
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      module.eligibility_lookup_lambda,
      module.order_result_lambda,
      module.get_order_lambda,
      module.get_results_lambda,
      module.login_lambda,
      module.order_service_lambda,
      module.session_lambda,
      module.order_status_lambda,
      module.postcode_lookup_lambda
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment
}

data "external" "supplier_id" {
  program = ["bash", "${path.module}/../scripts/localstack/get_supplier_id.sh"]
}
