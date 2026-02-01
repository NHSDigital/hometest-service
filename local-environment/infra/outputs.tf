output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.api.id
}

output "hello_endpoint" {
  description = "Hello Lambda endpoint"
  value       = module.hello_lambda.localstack_endpoint_url
}

output "eligibility_test_info_endpoint" {
  description = "Eligibility Test Info Lambda endpoint"
  value       = module.eligibility_test_info_lambda.localstack_endpoint_url
}
