BACKEND_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)

echo "NEXT_PUBLIC_BACKEND_URL=$BACKEND_BASE_URL" > ./ui/.env.local
