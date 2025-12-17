# Script to deploy Security related components
# The components will be deployed without associations (i.e. without associating the created WAF with CFDs or APIGWs)
# These associations will be done as part of the main stack deployment using the exported ARN of this stack as an argument

ENV_TYPE=$1

if [ -z "${NONPROD_INTEGRATOR_WAF_SECRET}" ]; then
  echo "Error: NONPROD_INTEGRATOR_WAF_SECRET is not set or is empty."
fi

cdk deploy -c environment=Security -c envType=${ENV_TYPE} --all --require-approval never
