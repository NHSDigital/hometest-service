variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hometest-service"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "local_service_mode" {
  description = "Primary local integration mode. Use wiremock for fully stubbed local flows or real for sandpit/real upstreams."
  type        = string
  default     = "wiremock"

  validation {
    condition     = contains(["wiremock", "real"], var.local_service_mode)
    error_message = "local_service_mode must be one of: wiremock, real."
  }
}

variable "local_postcode_lookup_base_url_override" {
  description = "Optional override for the postcode lookup upstream base URL."
  type        = string
  default     = null
}

variable "local_supplier_service_url_override" {
  description = "Optional override for the seeded local supplier service URL. Defaults to WireMock."
  type        = string
  default     = null
}

variable "local_use_ui_auth_url_override" {
  description = "Optional override for UI/backend/tests to use a specific UI login/auth URL instead of deriving from local_service_mode."
  type        = string
  default     = null
}
