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

const {
  dialogflow,
  Permission,
  Suggestions,
  DateTime,
  Place,
  Confirmation,
} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

// [START df_js_permission_reason]
app.intent('Permission', (conv) => {
  const permissions = ['NAME'];
  let context = 'To address you by name';
  // Location permissions only work for verified users
  // https://developers.google.com/actions/assistant/guest-users
  if (conv.user.verification === 'VERIFIED') {
    // Could use DEVICE_COARSE_LOCATION instead for city, zip code
    permissions.push('DEVICE_PRECISE_LOCATION');
    context += ' and know your location';
  }
  const options = {
    context,
    permissions,
  };
  conv.ask(new Permission(options));
});
// [END df_js_permission_reason]

// [START df_js_permission_accepted]
app.intent('Permission Handler', (conv, params, confirmationGranted) => {
  // Also, can access latitude and longitude
  // const { latitude, longitude } = location.coordinates;
  const {location} = conv.device;
  const {name} = conv.user;
  if (confirmationGranted && name && location) {
    conv.ask(`Okay ${name.display}, I see you're at ` +
      `${location.formattedAddress}`);
  } else {
    conv.ask(`Looks like I can't get your information.`);
  }
  conv.ask(`Would you like to try another helper?`);
  conv.ask(new Suggestions([
    'Confirmation',
    'DateTime',
    'Place',
  ]));
});
// [END df_js_permission_accepted]

// [START df_js_datetime_reason]
app.intent('Date Time', (conv) => {
  const options = {
    prompts: {
      initial: 'When would you like to schedule the appointment?',
      date: 'What day was that?',
      time: 'What time works for you?',
    },
  };
  conv.ask(new DateTime(options));
});
// [END df_js_datetime_reason]

// [START df_js_datetime_accepted]
app.intent('Date Time Handler', (conv, params, datetime) => {
  const {month, day} = datetime.date;
  const {hours, minutes} = datetime.time;
  conv.ask(`<speak>` +
      `Great, we will see you on ` +
      `<say-as interpret-as="date" format="dm">${day}-${month}</say-as>` +
      `<say-as interpret-as="time" format="hms12" detail="2">${hours}` +
      `:${minutes || '00'}</say-as>` +
      `</speak>`);
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'Confirmation',
    'Permission',
    'Place',
  ]));
});
// [END df_js_datetime_accepted]

// [START df_js_place_reason]
app.intent('Place', (conv) => {
  const options = {
    context: 'To find a location',
    prompt: 'Where would you like to go?',
  };
  conv.ask(new Place(options));
});
// [END df_js_place_reason]

// [START df_js_place_accepted]
app.intent('Place Handler', (conv, params, place) => {
  if (!place) {
    conv.ask(`Sorry, I couldn't get a location from you.`);
  } else {
    // Place also contains formattedAddress and coordinates
    const {name} = place;
    conv.ask(`${name} sounds like a great place to go!`);
  }
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'Confirmation',
    'DateTime',
    'Permission',
  ]));
});
// [END df_js_place_accepted]

// [START df_js_confirmation_reason]
app.intent('Confirmation', (conv) => {
  conv.ask(new Confirmation('Can you confirm?'));
});
// [END df_js_confirmation_reason]

// [START df_js_confirmation_accepted]
app.intent('Confirmation Handler', (conv, params, confirmationGranted) => {
  conv.ask(confirmationGranted
    ? 'Thank you for confirming'
    : 'No problem, you have not confirmed');
  conv.ask('Would you like to try another helper?');
  conv.ask(new Suggestions([
    'DateTime',
    'Permission',
    'Place',
  ]));
});
// [END df_js_confirmation_accepted]

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
