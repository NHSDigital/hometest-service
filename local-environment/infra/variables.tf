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
