#!/bin/bash

# This script sends an email using the AWS SES send-email API.
# ======================
# CONFIGURATION SECTION
# Update the variables below as needed
# ======================

AWS_REGION="eu-west-2" 
SENDER="test@dhctest.org"  # sender email
RECIPIENT="email-verification+develop+86236c9f-14c9-47a3-92b1-a868d3644670@dhctest.org"  # Recipient email
SUBJECT="Email to GP"
BODY_TEXT="This is a test email to GP"
BODY_HTML="<html><body><h1>Test Email</h1><p>This is a test email to GP</p></body></html>"

# ======================
# SEND EMAIL VIA AWS CLI SES API
# ======================

aws ses send-email \
  --region "$AWS_REGION" \
  --from "$SENDER" \
  --destination "ToAddresses=[$RECIPIENT]" \
  --message "Subject={Data=\"$SUBJECT\"},Body={Text={Data=\"$BODY_TEXT\"},Html={Data=\"$BODY_HTML\"}}" \
