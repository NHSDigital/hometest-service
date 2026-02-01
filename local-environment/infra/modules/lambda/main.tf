resource "aws_lambda_function" "this" {
  filename         = var.zip_path
  function_name    = "${var.project_name}-${var.function_name}"
  role            = var.lambda_role_arn
  handler         = var.handler
  runtime         = var.runtime
  source_code_hash = filebase64sha256(var.zip_path)

  environment {
    variables = var.environment_variables
  }

  depends_on = [var.lambda_role_policy_attachment]
}

resource "aws_api_gateway_resource" "this" {
  rest_api_id = var.api_gateway_id
  parent_id   = var.api_gateway_root_resource_id
  path_part   = var.api_path
}

resource "aws_api_gateway_method" "this" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.this.id
  http_method   = var.http_method
  authorization = var.authorization
}

resource "aws_api_gateway_integration" "this" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.this.id
  http_method = aws_api_gateway_method.this.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.this.invoke_arn
}

resource "aws_lambda_permission" "this" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}
