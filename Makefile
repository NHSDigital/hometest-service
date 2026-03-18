# This file is for you! Edit it to implement your own hooks (make targets) into
# the project as automated steps to be executed on locally and in the CD pipeline.

include scripts/init.mk

# ==============================================================================

config:: # Configure development environment (main) @Configuration
	# Install project-specific tool dependencies declared in the repository
	make _install-dependencies

# ==============================================================================

${VERBOSE}.SILENT: config
