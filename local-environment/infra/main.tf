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

resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api"
  description = "API Gateway for ${var.project_name}"
}

# Eligibility Test Info Lambda
module "eligibility_test_info_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "eligibility-test-info"
  zip_path                      = "${path.module}/../../lambdas/dist/eligibility-test-info-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "test-order/info"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
    DATABASE_URL = "postgresql://app_user:STRONG_APP_PASSWORD@postgres-db:5432/local_hometest_db?currentSchema=hometest"
  }
}

# Login Lambda
module "login_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "login"
  zip_path                      = "${path.module}/../../lambdas/dist/login-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "login"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic
  http_method                   = "POST"

  enable_cors            = true
  cors_allow_origin      = "http://localhost:3000"
  cors_allow_methods     = ["POST", "OPTIONS"]
  cors_allow_headers     = ["Content-Type", "Authorization"]
  cors_allow_credentials = true

  environment_variables = {
    NODE_OPTIONS                               = "--enable-source-maps",
    NHS_LOGIN_BASE_ENDPOINT_URL                = "https://auth.sandpit.signin.nhs.uk",
    NHS_LOGIN_CLIENT_ID                        = "hometest",
    NHS_LOGIN_REDIRECT_URL                     = "http://localhost:3000/callback",
    NHS_LOGIN_PRIVATE_KEY_SECRET_NAME          = "nhs-login-private-key",
    AUTH_SESSION_MAX_DURATION_MINUTES          = "60",
    AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES  = "60",
    AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES = "60",
    AUTH_COOKIE_SAME_SITE                      = "Lax"
  }
}

module "hello_world_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "hello-world"
  zip_path                      = "${path.module}/../../lambdas/dist/hello-world-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "hello-world"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
  }
}

resource "aws_sqs_queue" "order_placement" {
  name = "${var.project_name}-order-placement"
}

module "order_router_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "order-router"
  zip_path                      = "${path.module}/../../lambdas/dist/order-router-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "test-order/order"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
    DATABASE_URL = "postgresql://app_user:STRONG_APP_PASSWORD@postgres-db:5432/local_hometest_db?currentSchema=hometest"
  }
}

resource "aws_lambda_event_source_mapping" "order_router_order_placement" {
  event_source_arn = aws_sqs_queue.order_placement.arn
  function_name    = module.order_router_lambda.lambda_function.arn
  enabled          = true
  batch_size       = 1
}

# SQS Queue for order results
resource "aws_sqs_queue" "order_results" {
  name = "${var.project_name}-order-results"
}

module "order_result_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "order-result"
  zip_path                      = "${path.module}/../../lambdas/dist/order-result-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "result"
  http_method                   = "POST"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS     = "--enable-source-maps"
    AWS_REGION       = "eu-west-1"
    RESULT_QUEUE_URL = aws_sqs_queue.order_results.url
    SQS_ENDPOINT     = "http://localstack:4566"
  }
}

module "order_service_lambda" {
  source = "./modules/lambda"

  project_name                  = var.project_name
  function_name                 = "order-service"
  zip_path                      = "${path.module}/../../lambdas/dist/order-service-lambda.zip"
  lambda_role_arn               = aws_iam_role.lambda_role.arn
  environment                   = var.environment
  api_gateway_id                = aws_api_gateway_rest_api.api.id
  api_gateway_root_resource_id  = aws_api_gateway_rest_api.api.root_resource_id
  api_gateway_execution_arn     = aws_api_gateway_rest_api.api.execution_arn
  api_path                      = "order"
  http_method                   = "POST"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
    DATABASE_URL = "postgresql://app_user:STRONG_APP_PASSWORD@postgres-db:5432/local_hometest_db?currentSchema=hometest"
  }
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  depends_on = [
    module.eligibility_test_info_lambda,
    module.order_result_lambda,
    module.login_lambda,
    module.order_service_lambda
  ]

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
