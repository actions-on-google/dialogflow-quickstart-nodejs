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
  NewSurface,
  Suggestions,
  BasicCard,
} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('Current Capabilities', (conv) => {
  // [START df_js_has_capability]
  const hasScreen =
    conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    // OR conv.screen;
  const hasAudio =
    conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
  const hasMediaPlayback =
    conv.surface.capabilities.has('actions.capability.MEDIA_RESPONSE_AUDIO');
  const hasWebBrowser =
    conv.surface.capabilities.has('actions.capability.WEB_BROWSER');
  // Interactive Canvas must be enabled in your project to see this
  const hasInteractiveCanvas =
    conv.surface.capabilities.has('actions.capability.INTERACTIVE_CANVAS');
  // [END df_js_has_capability]

  conv.ask('Looks like your current device ' +
    (hasScreen ? 'has' : 'does not have') + ' the screen output capability, ' +
    (hasAudio ? 'has' : 'does not have') + ' the audio output capability, ' +
    (hasMediaPlayback ? 'has' : 'does not have') + ' the media capability, ' +
    (hasWebBrowser ? 'has' : 'does not have') + ' the browser capability, ' +
    (hasInteractiveCanvas ? 'has' : 'does not have') +
      ' the interactive canvas capability, ');
  conv.ask('What else would you like to try?');
  conv.ask(new Suggestions([
    'Transfer surface',
    'Check Audio Capability',
    'Check Screen Capability',
    'Check Media Capability',
    'Check Web Capability',
  ]));
});

app.intent('Transfer Surface', (conv) => {
  // [START df_js_screen_available]
  const screenAvailable =
    conv.available.surfaces.capabilities.has(
      'actions.capability.SCREEN_OUTPUT');
  // [END df_js_screen_available]

  // [START df_js_transfer_reason]
  if (conv.screen) {
    conv.ask(`You're already on a screen device.`);
    conv.ask('What else would you like to try?');
    conv.ask(new Suggestions([
      'Current Capabilities',
      'Check Audio Capability',
      'Check Screen Capability',
      'Check Media Capability',
      'Check Web Capability',
    ]));
    return;
  } else if (screenAvailable) {
    const context =
      `Let's move you to a screen device for cards and other visual responses`;
    const notification = 'Try your Action here!';
    const capabilities = ['actions.capability.SCREEN_OUTPUT'];
    return conv.ask(new NewSurface({context, notification, capabilities}));
  } else {
    conv.ask('It looks like there is no screen device ' +
      'associated with this user.');
    conv.ask('What else would you like to try?');
    conv.ask(new Suggestions([
      'Current Capabilities',
      'Check Audio Capability',
      'Check Screen Capability',
      'Check Media Capability',
      'Check Web Capability',
    ]));
  };
  // [END df_js_transfer_reason]
});

// [START df_js_transfer_accepted]
app.intent('Transfer Surface - NEW_SURFACE', (conv, input, newSurface) => {
  if (newSurface.status === 'OK') {
    conv.ask('Welcome to a screen device!');
    conv.ask(new BasicCard({
      title: `You're on a screen device!`,
      text: `Screen devices support basic cards and other visual responses!`,
    }));
  } else {
    conv.ask(`Ok, no problem.`);
  }
  conv.ask('What else would you like to try?');
  conv.ask(new Suggestions([
    'Current Capabilities',
    'Check Audio Capability',
    'Check Screen Capability',
    'Check Media Capability',
    'Check Web Capability',
  ]));
});
// [END df_js_transfer_accepted]

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
