// Copyright 2019, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START imports_df]
const {
  dialogflow,
  UpdatePermission,
  Suggestions,
} = require('actions-on-google');
// [END imports_df]

const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', (conv) => {
  if (!conv.screen) {
    return conv.close(`Hi! Welcome to Push Notifications! To learn ` +
      `about push notifications you will need to switch to a screened device.`);
  }
  if (conv.user.verification !== 'VERIFIED') {
    return conv.close('Hi! Welcome to Push Notifications! To learn ' +
      `about push notifications you'll need to be a verified user.`);
  }

  conv.ask('Hi! Welcome to Push Notifications!');
  // [START suggest_notifications_df]
  conv.ask('I can send you push notifications. Would you like that?');
  conv.ask(new Suggestions('Send notifications'));
  // [END suggest_notifications_df]
});

app.intent('Notification', (conv) => {
  conv.close('You got a push notification!');
});

// [START subscribe_to_notifications_df]
app.intent('Subscribe to Notifications', (conv) => {
  conv.ask(new UpdatePermission({
    intent: 'Notification',
  }));
});
// [END subscribe_to_notifications_df]

// [START confirm_notifications_subscription_df]
app.intent('Confirm Notifications Subscription', (conv) => {
  if (conv.arguments.get('PERMISSION')) {
    const updatesUserId = conv.arguments.get('UPDATES_USER_ID');
    // Store user ID in database for later use
    conv.close(`Ok, I'll start alerting you.`);
  } else {
    conv.close(`Ok, I won't alert you.`);
  }
});
// [END confirm_notifications_subscription_df]

// Paste your service account credentials here.
const serviceAccount = {
  // "type": "",
  // "project_id": "",
  // "private_key_id": "",
  // "private_key": "",
  // "client_email": "",
  // "client_id": "",
  // "auth_uri": "",
  // "token_uri": "",
  // "auth_provider_x509_cert_url": "",
  // "client_x509_cert_url": ""
};

// [START send_notification_df]
const {google} = require('googleapis');
const request = require('request');

const jwtClient = new google.auth.JWT(
  serviceAccount.client_email, null, serviceAccount.private_key,
  ['https://www.googleapis.com/auth/actions.fulfillment.conversation'],
  null
);

jwtClient.authorize((err, tokens) => {
  if (!err) {
    request.post('https://actions.googleapis.com/v2/conversations:send', {
      auth: {
        bearer: tokens.access_token,
      },
      json: true,
      body: {
        customPushMessage: {
          userNotification: {
            title: 'Push Notification Title',
          },
          target: {
            userId: '<UPDATES_USER_ID>',
            intent: 'Notification Intent',
          },
        },
        isInSandbox: true,
      },
    }, (err, httpResponse, body) => {
      console.log(`${httpResponse.statusCode}: ${httpResponse.statusMessage}`);
    });
  }
});
// [END send_notification_df]

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
