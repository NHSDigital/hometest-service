#!/bin/bash

# This script sends an email using the SMTP protocol with both plain text and HTML body
# ======================
# CONFIGURATION SECTION
# Update the variables below as needed
# ======================
SMTP_SERVER="email-smtp.eu-west-2.amazonaws.com"    # AWS SES SMPT server host
SMTP_PORT="587"                                     # AWS SES SMPT server port
SMTP_USERNAME=""                                    # provide username (stored in nhc/<account>/dnhc-smtp-username secret)
SMTP_PASSWORD=""                                    # provide password (stored in nhc/<account>/dnhc-smtp-password secret)
MAIL_FROM="test-send@dhctest.org"
MAIL_TO="email-verification@dhctest.org"
SUBJECT="Test Email from SES SMTP"
BODY_TEXT="GP Email"
BODY_HTML="<html><body><h1>GP Email</h1></body></html>"
EHLO_DOMAIN="dhctest.org"

# Generate a random boundary
BOUNDARY="====$(date +%s)===="

# Encode SMTP username and password using base64
EncodedSMTPUsername=$(echo -n "$SMTP_USERNAME" | openssl enc -base64)
EncodedSMTPPassword=$(echo -n "$SMTP_PASSWORD" | openssl enc -base64)

# Construct the email with multipart/alternative
Email="EHLO $EHLO_DOMAIN
AUTH LOGIN
$EncodedSMTPUsername
$EncodedSMTPPassword
MAIL FROM: <$MAIL_FROM>
RCPT TO: <$MAIL_TO>
DATA
From: $MAIL_FROM
To: $MAIL_TO
Subject: $SUBJECT
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=\"$BOUNDARY\"

--$BOUNDARY
Content-Type: text/plain; charset=\"UTF-8\"
Content-Transfer-Encoding: 7bit

$BODY_TEXT
--$BOUNDARY
Content-Type: text/html; charset=\"UTF-8\"
Content-Transfer-Encoding: 7bit

$BODY_HTML
--$BOUNDARY--
.
QUIT"

echo "$Email" | openssl s_client -crlf -quiet -starttls smtp -connect "$SMTP_SERVER:$SMTP_PORT"