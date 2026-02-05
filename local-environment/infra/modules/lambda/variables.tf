variable "project_name" { type = string }
variable "function_name" { type = string }
variable "environment" { type = string }
variable "zip_path" { type = string }
variable "lambda_role_arn" { type = string }
variable "handler" {
  type    = string
  default = "index.handler"
}
variable "runtime" {
  type    = string
  default = "nodejs24.x"
}
variable "environment_variables" {
  type = map(string)
  default = {
    NODE_OPTIONS = "--enable-source-maps"
  }
}
variable "api_gateway_id" { type = string }
variable "api_gateway_root_resource_id" { type = string }
variable "api_gateway_execution_arn" { type = string }
variable "api_path" { type = string }
variable "http_method" {
  type    = string
  default = "GET"
}
variable "authorization" {
  type    = string
  default = "NONE"
}
variable "lambda_role_policy_attachment" {}
