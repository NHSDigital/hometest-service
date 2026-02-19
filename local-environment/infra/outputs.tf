output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "api_base_url" {
  description = "LocalStack API base URL for tests"
  value       = "http://localhost:4566/restapis/${aws_api_gateway_rest_api.api.id}/${var.environment}/_user_request_"
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

output "order_result_endpoint" {
  description = "Order Result Lambda endpoint"
  value       = module.order_result_lambda.localstack_endpoint_url
}

output "order_results_queue_url" {
  description = "SQS Queue URL for order results"
  value       = aws_sqs_queue.order_results.url
}

output "order_router_endpoint" {
  description = "Order Router Lambda endpoint"
  value       = module.order_router_lambda.localstack_endpoint_url
}

output "get_order_endpoint" {
  description = "Get Order  Lambda endpoint"
  value       = module.get_order_lambda.localstack_endpoint_url
}

output "login_endpoint" {
  description = "Login Lambda endpoint"
  value       = module.login_lambda.localstack_endpoint_url
}

output "session_endpoint" {
  description = "Session Lambda endpoint"
  value       = module.session_lambda.localstack_endpoint_url
}

output "backend_base_url" {
  description = "Base URL for calling backend routes in LocalStack (append /login, /session, etc.)"
  value       = "http://localhost:4566/_aws/execute-api/${aws_api_gateway_rest_api.api.id}/${var.environment}"
}

output "seed_supplier_id" {
  value       = data.external.supplier_id.result["supplier_id"]
  description = "The supplier_id of the seeded supplier with service_url http://wiremock:8080"
}

output "order_placement_queue_url" {
  description = "SQS Queue URL for order placement"
  value       = aws_sqs_queue.order_placement.url
}

output "ui_url" {
  description = "URL of the UI application"
  value       = "http://localhost:3000"
}

output "order_service_endpoint" {
  description = "Order Service Lambda endpoint"
  value       = module.order_service_lambda.localstack_endpoint_url
}
