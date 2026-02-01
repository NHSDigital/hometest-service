terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
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
  }
}

# Secrets from JSON files
locals {
  secrets_dir  = "${path.module}/resources/secrets"
  secret_files = fileset(local.secrets_dir, "*.json")
}

resource "aws_secretsmanager_secret" "secrets" {
  for_each = local.secret_files
  name     = trimsuffix(each.key, ".json")
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each      = local.secret_files
  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = file("${local.secrets_dir}/${each.key}")
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
  api_path                      = "eligibility-test-info"
  lambda_role_policy_attachment = aws_iam_role_policy_attachment.lambda_basic

  environment_variables = {
    NODE_OPTIONS = "--enable-source-maps"
    DATABASE_URL = "postgresql://app_user:STRONG_APP_PASSWORD@postgres-db:5432/mydb?currentSchema=hometest"
  }
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  depends_on = [
    module.eligibility_test_info_lambda,
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
