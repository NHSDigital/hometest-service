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

variable "local_nhs_login_client_id" {
  description = "NHS Login client id for local login/session lambda configuration."
  type        = string
  default     = "hometest"
}

variable "local_nhs_login_scope" {
  description = "NHS Login scope for local UI authorize requests."
  type        = string
  default     = "openid profile email phone"
}

variable "local_nhs_login_redirect_url" {
  description = "NHS Login redirect URL used by local login lambda configuration."
  type        = string
  default     = "http://localhost:3000/callback"
}

variable "local_nhs_login_private_key_secret_name" {
  description = "Secrets Manager secret name containing the NHS Login private key for login lambda signing."
  type        = string
  default     = "nhs-login-private-key"
}

variable "local_auth_cookie_private_keys_secret_name" {
  description = "Secrets Manager secret name containing auth cookie private keys for login lambda."
  type        = string
  default     = "nhs-login-private-key"
}

variable "local_auth_cookie_public_key_secret_name" {
  description = "Secrets Manager secret name containing auth cookie public key for session lambda verification."
  type        = string
  default     = "nhs-login-private-key"
}

variable "local_auth_cookie_key_id" {
  description = "Key id used for auth cookies in local session lambda configuration."
  type        = string
  default     = "key"
}

variable "local_auth_session_max_duration_minutes" {
  description = "Maximum auth session duration in minutes for local login lambda configuration."
  type        = string
  default     = "60"
}

variable "local_auth_access_token_expiry_duration_minutes" {
  description = "Access token expiry duration in minutes for local login lambda configuration."
  type        = string
  default     = "60"
}

variable "local_auth_refresh_token_expiry_duration_minutes" {
  description = "Refresh token expiry duration in minutes for local login lambda configuration."
  type        = string
  default     = "60"
}

variable "local_auth_cookie_same_site" {
  description = "SameSite policy used for auth cookie generation in local login lambda configuration."
  type        = string
  default     = "Lax"
}

variable "local_auth_cookie_secure" {
  description = "Whether auth cookie generation should set the Secure flag in local login lambda configuration."
  type        = string
  default     = "false"
}
