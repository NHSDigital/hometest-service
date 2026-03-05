resource "aws_lambda_function" "this" {
  filename         = var.zip_path
  function_name    = "${var.project_name}-${var.function_name}"
  role             = var.lambda_role_arn
  handler          = var.handler
  runtime          = var.runtime
  source_code_hash = filebase64sha256(var.zip_path)
  timeout          = var.timeout

  environment {
    variables = var.environment_variables
  }

  depends_on = [var.lambda_role_policy_attachment]
}

locals {
  path_segments = split("/", var.api_path)
}

# Create first path segment
resource "aws_api_gateway_resource" "base_path" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = local.path_segments[0]
}

# Create remaining path segments if they exist
resource "aws_api_gateway_resource" "nested_path" {
  count       = length(local.path_segments) > 1 ? 1 : 0
  rest_api_id = var.api_gateway_id
  parent_id   = aws_api_gateway_resource.base_path.id
  path_part   = local.path_segments[1]
}

# Use the appropriate final resource
locals {
  final_resource_id = length(local.path_segments) > 1 ? aws_api_gateway_resource.nested_path[0].id : aws_api_gateway_resource.base_path.id
}

resource "aws_api_gateway_method" "this" {
  rest_api_id   = var.api_gateway_id
  resource_id   = local.final_resource_id
  http_method   = var.http_method
  authorization = var.authorization
}

resource "aws_api_gateway_integration" "this" {
  rest_api_id = var.api_gateway_id
  resource_id = local.final_resource_id
  http_method = aws_api_gateway_method.this.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.id}:lambda:path/2015-03-31/functions/${aws_lambda_function.this.arn}/invocations"
}

resource "aws_lambda_permission" "this" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

data "aws_region" "current" {}

locals {
  cors_allow_methods = join(", ", var.cors_allow_methods)
  cors_allow_headers = join(", ", [for header in var.cors_allow_headers : lower(header)])
}

resource "aws_api_gateway_method" "cors_options" {
  count         = var.enable_cors ? 1 : 0
  rest_api_id   = var.api_gateway_id
  resource_id   = local.final_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors_options" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = var.api_gateway_id
  resource_id = local.final_resource_id
  http_method = aws_api_gateway_method.cors_options[0].http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "cors_options_200" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = var.api_gateway_id
  resource_id = local.final_resource_id
  http_method = aws_api_gateway_method.cors_options[0].http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"      = true
    "method.response.header.Access-Control-Allow-Methods"     = true
    "method.response.header.Access-Control-Allow-Headers"     = true
    "method.response.header.Access-Control-Allow-Credentials" = true
  }
}

resource "aws_api_gateway_integration_response" "cors_options_200" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = var.api_gateway_id
  resource_id = local.final_resource_id
  http_method = aws_api_gateway_method.cors_options[0].http_method
  status_code = aws_api_gateway_method_response.cors_options_200[0].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"      = "'${var.cors_allow_origin}'"
    "method.response.header.Access-Control-Allow-Methods"     = "'${local.cors_allow_methods}'"
    "method.response.header.Access-Control-Allow-Headers"     = "'${local.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Credentials" = var.cors_allow_credentials ? "'true'" : "'false'"
  }

  depends_on = [
    aws_api_gateway_integration.cors_options
  ]
}
