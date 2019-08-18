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

// [START df_js_reprompt]
const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('Reprompt', (conv) => {
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
  conv.ask(`What was that?`);
  } else if (repromptCount === 1) {
  conv.ask(`Sorry I didn't catch that. Could you repeat yourself?`);
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
  conv.close(`Okay let's try this again later.`);
  }
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
// [END df_js_reprompt]

