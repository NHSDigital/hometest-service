#!/bin/bash

function getCertificateIfPresent() {
    local CERTIFICATE_DOMAIN=$1
    local CERTIFICATE_REGION=$2
    local CERTIFICATE_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='"$CERTIFICATE_DOMAIN"'].CertificateArn" --output text --region $CERTIFICATE_REGION)
    echo $CERTIFICATE_ARN
}

function createCertificate() {
    local CERTIFICATE_DOMAIN=$1
    local CERTIFICATE_REGION=$2
    local CERTIFICATE_ARN=$(aws acm request-certificate --domain-name "$CERTIFICATE_DOMAIN" --validation-method=DNS --region "$CERTIFICATE_REGION" --output text)   
    echo $CERTIFICATE_ARN
}

function fetchStackOutputValue() {
    local STACK_NAME=$1
    local OUTPUT_NAME=$2

    OUTPUT_VALUE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='"$OUTPUT_NAME"'].OutputValue" --output text)
    echo $OUTPUT_VALUE
}

function fetchSecretValue() {
    local SECRET_NAME=$1

    SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query 'SecretString' --output text)
    echo $SECRET_VALUE
}