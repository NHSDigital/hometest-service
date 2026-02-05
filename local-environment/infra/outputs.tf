output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.api.id
}

output "eligibility_test_info_endpoint" {
  description = "Eligibility Test Info Lambda endpoint"
  value       = module.eligibility_test_info_lambda.localstack_endpoint_url
}

output "hello_world_endpoint" {
  description = "Hello World Lambda endpoint"
  value       = module.hello_world_lambda.localstack_endpoint_url
}

output "order_router_endpoint" {
  description = "Order Router Lambda endpoint"
  value       = module.order_router_lambda.localstack_endpoint_url
}

output "order_result_endpoint" {
  description = "Order Result Lambda endpoint"
  value       = module.order_result_lambda.localstack_endpoint_url
}

output "order_results_queue_url" {
  description = "SQS Queue URL for order results"
  value       = aws_sqs_queue.order_results.url
}

output "login_endpoint" {
  description = "Login Lambda endpoint"
  value       = module.login_lambda.localstack_endpoint_url
}
