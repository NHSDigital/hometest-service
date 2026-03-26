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

output "eligibility_lookup_endpoint" {
  description = "Eligibility Lookup Lambda endpoint"
  value       = module.eligibility_lookup_lambda.localstack_endpoint_url
}

output "hello_world_endpoint" {
  description = "Hello World Lambda endpoint"
  value       = module.hello_world_lambda.localstack_endpoint_url
}

output "order_result_endpoint" {
  description = "Order Result Lambda endpoint"
  value       = module.order_result_lambda.localstack_endpoint_url
}

output "order_router_endpoint" {
  description = "Order Router Lambda endpoint"
  value       = module.order_router_lambda.localstack_endpoint_url
}

output "get_order_endpoint" {
  description = "Get Order Lambda endpoint"
  value       = module.get_order_lambda.localstack_endpoint_url
}

output "get_results_endpoint" {
  description = "Get Results Lambda endpoint"
  value       = module.get_results_lambda.localstack_endpoint_url
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

output "postcode_lookup_endpoint" {
  description = "Postcode Lookup Lambda endpoint"
  value       = module.postcode_lookup_lambda.localstack_endpoint_url
}

output "seed_supplier_id" {
  value       = data.external.supplier_id.result["supplier_id"]
  description = "The supplier_id of the seeded supplier (service_url points at mock-service Lambda on LocalStack)"
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

output "order_status_endpoint" {
  description = "Order Status Lambda endpoint"
  value       = module.order_status_lambda.localstack_endpoint_url
}

################################################################################
# Mock Service Outputs
################################################################################

output "mock_api_base_url" {
  description = "Base URL for the mock API on LocalStack"
  value       = "http://localhost:4566/_aws/execute-api/${aws_api_gateway_rest_api.mock_api.id}/${var.environment}"
}

output "mock_supplier_base_url" {
  description = "Supplier mock base URL (use as service_url in supplier table)"
  value       = "http://localstack-main:4566/_aws/execute-api/${aws_api_gateway_rest_api.mock_api.id}/${var.environment}/mock/supplier"
}

output "mock_supplier_base_url_host" {
  description = "Supplier mock base URL accessible from host machine"
  value       = "http://localhost:4566/_aws/execute-api/${aws_api_gateway_rest_api.mock_api.id}/${var.environment}/mock/supplier"
}

output "mock_cognito_jwks_url" {
  description = "Mock Cognito JWKS URL"
  value       = "http://localhost:4566/_aws/execute-api/${aws_api_gateway_rest_api.mock_api.id}/${var.environment}/mock/cognito/.well-known/jwks.json"
}

output "mock_postcode_base_url" {
  description = "Mock postcode lookup base URL"
  value       = "http://localhost:4566/_aws/execute-api/${aws_api_gateway_rest_api.mock_api.id}/${var.environment}/mock/postcode"
}
