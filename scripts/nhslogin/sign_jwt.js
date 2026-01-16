// This script will sign a JWT for use with NHS Login (Sandpit)
// The script needs to placed in the same directory as the registered private_key and public_key
// Run the script in terminal using the command node sign_jwt.js


import fs from 'fs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Load private key
const privateKey = fs.readFileSync('./private_key.pem', 'utf-8');

// Config
const clientId = 'hometest';
const baseUri = 'https://auth.sandpit.signin.nhs.uk';
const expiresIn = 300; // seconds (5 minutes)

// JWT sign options
const signOptions = {
  algorithm: 'RS512',
  subject: clientId,
  issuer: clientId,
  audience: `${baseUri}/token`,
  jwtid: uuidv4(),
  expiresIn
};

try {
  console.log('about to sign jwt token');

  const clientAssertion = jwt.sign(
    {},            // empty payload
    privateKey,
    signOptions
  );

  console.log('jwt token successfully signed');
  console.log(clientAssertion);
} catch (error) {
  console.error('could not sign jwt token', error);
  process.exit(1);
}
