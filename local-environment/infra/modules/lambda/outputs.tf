output "lambda_function" {
  value = aws_lambda_function.this
}
output "api_method" {
  value = aws_api_gateway_method.this
}
output "api_integration" {
  value = aws_api_gateway_integration.this
}

output "localstack_endpoint_url" {
  description = "Lambda endpoint URL for LocalStack"
  value       = "http://localhost:4566/_aws/execute-api/${var.api_gateway_id}/${var.environment}/${var.api_path}"
}
