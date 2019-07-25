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

const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', (conv) => {
  if (conv.user.storage.sum) {
    conv.ask(`Hi! Your last result was ${conv.user.storage.sum}`);
  } else {
    conv.ask(`Hi! Let's add two numbers.`);
  }
  conv.ask(`What's the first number?`);
});

// [START save_data_between_turns_df]
app.intent('Get First Number', (conv, {firstNum}) => {
  conv.data.firstNum = firstNum;
  conv.ask(`Got it, the first number is ${firstNum}.`);
  conv.ask(`What's the second number?`);
});
// [END save_data_between_turns_df]

app.intent('Get Second Number', (conv, {secondNum}) => {
  const sum = conv.data.firstNum + secondNum;
  conv.data.sum = sum;
  conv.ask(`Got it, the second number is ${secondNum}.` +
    `The sum of both numbers is ${sum}.`);
  conv.ask(`Should I remember that for next time?`);
});

// [START save_data_across_convs_df]
app.intent('Save Sum', (conv) => {
  conv.user.storage.sum = conv.data.sum;
  conv.close(`Alright, I'll store that for next time. See you then.`);
});
// [END save_data_across_convs_df]

// [START clear_user_storage_df]
app.intent('Forget Number', (conv) => {
  conv.user.storage = {};
  conv.ask(`Alright, I forgot your last result.`);
  conv.ask(`Let's add two new numbers. What is the first number?`);
});
// [END clear_user_storage_df]


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
