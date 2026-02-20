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

variable "enable_cors" {
  type    = bool
  default = false
}

variable "cors_allow_origin" {
  type        = string
  default     = ""
  description = "Exact origin, e.g. https://app.example.com or http://localhost:3000 (not *) when allow_credentials=true"
}

variable "cors_allow_credentials" {
  type    = bool
  default = true
}

variable "cors_allow_headers" {
  type    = list(string)
  default = ["Content-Type", "Authorization", "X-Requested-With"]
}

variable "cors_allow_methods" {
  type    = list(string)
  default = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "timeout" {
  type        = number
  default     = 10
  description = "Lambda function timeout in seconds (default: 10)"
}
