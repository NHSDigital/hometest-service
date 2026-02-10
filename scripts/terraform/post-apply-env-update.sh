LOGIN_ENDPOINT=$(terraform -chdir=local-environment/infra output -raw login_endpoint)
echo "NEXT_PUBLIC_LOGIN_LAMBDA_ENDPOINT=$LOGIN_ENDPOINT" > ./ui/.env.local
