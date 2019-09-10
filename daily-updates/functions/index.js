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

// [START du_imports_df_js]
const {
  dialogflow,
  RegisterUpdate,
  Suggestions,
} = require('actions-on-google');
// [END du_imports_df_js]

const functions = require('firebase-functions');

const app = dialogflow({debug: true});

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const lowestTemperatures = {
  'Monday': '75°F',
  'Tuesday': '75°F',
  'Wednesday': '75°F',
  'Thursday': '75°F',
  'Friday': '75°F',
  'Saturday': '75°F',
  'Sunday': '75°F',
};

app.intent('Default Welcome Intent', (conv) => {
  if (!conv.screen) {
    return conv.close(`Hi! Welcome to Lowest Temperature Updates! To learn ` +
      `about user engagement you will need to switch to a screened device.`);
  }
  if (conv.user.verification !== 'VERIFIED') {
    return conv.close('Hi! Welcome to Lowest Temperature Updates! To learn ' +
      `about user engagement you'll need to be a verified user.`);
  }

  conv.ask('Hi! Welcome to Lowest Temperature Updates! I can ' +
  'tell you the lowest temperature each day.');
  conv.ask(new Suggestions('Hear lowest temperature'));
});


/**
* Best practices: Ask for daily updates in a limited capacity for optimal
* user experience. In a production-ready app, you should be more 
* sophisticated about this, i.e. re-ask after a certain period of time
* or number of interactions.
*/
// [START suggest_daily_updates_df]
app.intent('Daily Lowest Temperature', (conv, params) => {
  const today = DAYS[new Date().getDay()];
  const lowestTemperature = lowestTemperatures[today];
  conv.ask(`The lowest temperature for today is ${lowestTemperature}`);
  conv.ask('I can send you daily updates with the lowest temperature' +
    ' of the day. Would you like that?');
  conv.ask(new Suggestions('Send daily updates'));
});
// [END suggest_daily_updates_df]

// [START subscribe_to_daily_updates_df]
app.intent('Subscribe to Daily Updates', (conv) => {
  conv.ask(new RegisterUpdate({
    intent: 'Daily Lowest Temperature',
    frequency: 'DAILY',
  }));
});
// [END subscribe_to_daily_updates_df]

// [START confirm_daily_updates_subscription_df]
app.intent('Confirm Daily Updates Subscription', (conv, params, registered) => {
  if (registered && registered.status === 'OK') {
    conv.close(`Ok, I'll start giving you daily updates.`);
  } else {
    conv.close(`Ok, I won't give you daily updates.`);
  }
});
// [END confirm_daily_updates_subscription_df]

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
