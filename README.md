## DPRH BACKEND

## Project Status

**WIP**

## Installation and Setup Instructions

Clone down this repository. You will need `node v16.14.2` (https://nodejs.org/download/release/v16.14.2/and) and `npm v8.5.0`(https://www.npmjs.com/package/npm/v/8.5.0) installed globally on your machine.

#Installation:

`yarn`

To Run Test Suite:

`yarn test`

#To Start Server:

Make sure to create a .env file at the root of project and include:

API_PORT =`${API_PORT}`

> Any available PORT

MONGODB_URL=`${MONGODB_URL}`

> https://www.mongodb.com/docs/manual/reference/connection-string/

BASE_URL=`${BASE_URL}`

> The URL of the frontend
> Exemple:BASE_URL=https://app.Talenty/

TOKEN_KEY=`${TOKEN_KEY}`

> A string between 16-32 chars

ENC_KEY=`${ENC_KEY}`

> A string between 16-32 chars

NEW_CLIENT=`true|fslse`

> SET TO TRUE TO CREATE A NEW DATABASE FOR A FRESH CLIENT.
>
> **Please set to false after the initialization**

BCRYPT_SALT=`${BCRYPT_SALT}`

> INT between 5 and 10(https://github.com/kelektiv/node.bcrypt.js/)

RECAPTCHA=`${CAPTCHA_SECRET}`

> https://developers.google.com/recaptcha/docs/v3?hl=fr

AFFINDA_API_KEY=`${AFFINDA_API_KEY}`

> https://docs.affinda.com/docs/api-overview

OPENIA_API_KEY=`${OPENIA_API_KEY}`

> https://platform.openai.com/playground

CALENDLY_ACCESS_TOKEN=`${CALENDLY_ACCESS_TOKEN}`

> https://platform.openai.com/playground

CALENDLY_ORGANIZATION_URL=`${CALENDLY_ORGANIZATION_URL}`

> https://developer.calendly.com/how-to-find-the-organization-or-user-uri

EMAIL=`${EMAIL}`

> EMAIL used to send emails to candidates

EMAIL_PWD=`${EMAIL_PWD}`

> The password of the email

PROD=`true|false`

SESSION_KEY=`${SESSION_ENCRYPTION_TOKEN}`

Then RUN `yarn start`

#To Visit App:

`localhost:${API_PORT}`
