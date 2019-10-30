/* eslint-disable no-unused-vars */
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

// Imports
const {
  DeliveryAddress,
  OrderUpdate,
  SignIn,
  SimpleResponse,
  Suggestions,
  TransactionDecision,
  TransactionRequirements,
} = require('actions-on-google');
const functions = require('firebase-functions');

/*
  Paste your client ID here.
  The client ID for Google Sign-In Account Linking
  can be found in the Account Linking tab of the
  Actions on Google console.
*/
const clientId = 'CLIENT_ID';

/*
  The unique ID of the order,
  Update this variable to provide a unique ID for the order.
  Re-using old order IDs will cause the transaction to fail.
*/
const orderId = 'ORDER_ID';

/*
  Paste your service account credentials here.
  or import a service account file
  const serviceAccountKey = require('./service-account.json')
*/
const serviceAccountKey = {
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

// Instantiate dialogflow app that uses Orders v3
// [START orders_v3]
const {dialogflow} = require('actions-on-google');
let app = dialogflow({
  clientId, // If using account linking
  debug: true,
  ordersv3: true,
});
// [END orders_v3]

const suggestIntents = [
  'Merchant Transaction',
  'Google Pay Transaction',
];
app.intent('Default Welcome Intent', (conv) => {
  conv.ask(new SimpleResponse({
    speech: 'Hey there! I can help you go through a transaction with Google ' +
      'Pay and Merchant-managed payments.',
    text: 'Hi there! I can help you go through a transaction with Google ' +
      'Pay and Merchant-managed payments.',
  }));
  conv.ask(new Suggestions(suggestIntents));
});

// [START sign_in_df]
app.intent('Sign In', (conv) => {
  conv.ask(new SignIn('To get your account details'));
});
// [END sign_in_df]

// [START get_sign_in_status_df]
app.intent('Sign In Complete', (conv, params, signin) => {
  if (signin.status !== 'OK') {
    conv.ask('You need to sign in before making a transaction.');
  } else {
    const accessToken = conv.user.access.token;
    // possibly do something with access token
    conv.ask('You must meet all the requirements necessary ' +
      'to make a transaction. Try saying ' +
      '"check transaction requirements".');
      conv.ask(new Suggestions(`check requirements`));
  }
});
// [END get_sign_in_status_df]

// Check transaction requirements for Merchant payment
app.intent('Transaction Check Merchant', (conv) => {
  // [START transaction_check_df]
  conv.ask(new TransactionRequirements());
  // [END transaction_check_df]
});

// Check transaction requirements for Google payment
app.intent('Transaction Check Google', (conv) => {
  conv.ask(new TransactionRequirements());
});

// Check result of transaction requirements
// [START transaction_check_complete_df]
app.intent('Transaction Check Complete', (conv) => {
  const arg = conv.arguments.get('TRANSACTION_REQUIREMENTS_CHECK_RESULT');
  if (arg && arg.resultType === 'CAN_TRANSACT') {
    // Normally take the user through cart building flow
    conv.ask(`Looks like you're good to go! ` +
      `Next I'll need your delivery address.` +
      `Try saying "get delivery address".`);
    conv.ask(new Suggestions('get delivery address'));
  } else {
    // Exit conversation
    conv.close('Transaction failed.');
  }
});
// [END transaction_check_complete_df]

// [START delivery_address_df]
app.intent('Delivery Address', (conv) => {
  conv.ask(new DeliveryAddress({
    addressOptions: {
      reason: 'To know where to send the order',
    },
  }));
});
// [END delivery_address_df]

// [START delivery_address_complete_df]
app.intent('Delivery Address Complete', (conv) => {
  const arg = conv.arguments.get('DELIVERY_ADDRESS_VALUE');
  if (arg && arg.userDecision ==='ACCEPTED') {
    conv.data.location = arg.location;
    conv.ask('Great, got your address! Now say "confirm transaction".');
    conv.ask(new Suggestions('confirm transaction'));
  } else {
    conv.close('Transaction failed.');
  }
});
// [END delivery_address_complete_df]

// Ask perform the transaction / place order
app.intent('Transaction Decision', (conv) => {
  const location = conv.data.location;
  conv.data.latestOrderId = orderId;
  // Build order (using Orders v3 schema)
  // [START build_order_df]
  const order = {
    createTime: '2019-09-24T18:00:00.877Z',
    lastUpdateTime: '2019-09-24T18:00:00.877Z',
    merchantOrderId: orderId, // A unique ID String for the order
    userVisibleOrderId: orderId,
    transactionMerchant: {
      id: 'http://www.example.com',
      name: 'Example Merchant',
    },
    contents: {
      lineItems: [
        {
          id: 'LINE_ITEM_ID',
          name: 'Pizza',
          description: 'A four cheese pizza.',
          priceAttributes: [
            {
              type: 'REGULAR',
              name: 'Item Price',
              state: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                amountInMicros: 8990000,
              },
              taxIncluded: true,
            },
            {
              type: 'TOTAL',
              name: 'Total Price',
              state: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                amountInMicros: 9990000,
              },
              taxIncluded: true,
            },
          ],
          notes: [
            'Extra cheese.',
          ],
          purchase: {
            quantity: 1,
            unitMeasure: {
              measure: 1,
              unit: 'POUND',
            },
            itemOptions: [
              {
                id: 'ITEM_OPTION_ID',
                name: 'Pepperoni',
                prices: [
                  {
                    type: 'REGULAR',
                    state: 'ACTUAL',
                    name: 'Item Price',
                    amount: {
                      currencyCode: 'USD',
                      amountInMicros: 1000000,
                    },
                    taxIncluded: true,
                  },
                  {
                    type: 'TOTAL',
                    name: 'Total Price',
                    state: 'ACTUAL',
                    amount: {
                      currencyCode: 'USD',
                      amountInMicros: 1000000,
                    },
                    taxIncluded: true,
                  },
                ],
                note: 'Extra pepperoni',
                quantity: 1,
                subOptions: [],
              },
            ],
          },
        },
      ],
    },
    buyerInfo: {
      email: 'janedoe@gmail.com',
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Jane Doe',
    },
    priceAttributes: [
      {
        type: 'SUBTOTAL',
        name: 'Subtotal',
        state: 'ESTIMATE',
        amount: {
          currencyCode: 'USD',
          amountInMicros: 9990000,
        },
        taxIncluded: true,
      },
      {
        type: 'DELIVERY',
        name: 'Delivery',
        state: 'ACTUAL',
        amount: {
          currencyCode: 'USD',
          amountInMicros: 2000000,
        },
        taxIncluded: true,
      },
      {
        type: 'TAX',
        name: 'Tax',
        state: 'ESTIMATE',
        amount: {
          currencyCode: 'USD',
          amountInMicros: 3780000,
        },
        taxIncluded: true,
      },
      {
        type: 'TOTAL',
        name: 'Total Price',
        state: 'ESTIMATE',
        amount: {
          currencyCode: 'USD',
          amountInMicros: 15770000,
        },
        taxIncluded: true,
      },
    ],
    followUpActions: [
      {
        type: 'VIEW_DETAILS',
        title: 'View details',
        openUrlAction: {
          url: 'http://example.com',
        },
      },
      {
        type: 'CALL',
        title: 'Call us',
        openUrlAction: {
          url: 'tel:+16501112222',
        },
      },
      {
        type: 'EMAIL',
        title: 'Email us',
        openUrlAction: {
          url: 'mailto:person@example.com',
        },
      },
    ],
    termsOfServiceUrl: 'http://www.example.com',
    note: 'Sale event',
    promotions: [
      {
        coupon: 'COUPON_CODE',
      },
    ],
    purchase: {
      status: 'CREATED',
      userVisibleStatusLabel: 'CREATED',
      type: 'FOOD',
      returnsInfo: {
        isReturnable: false,
        daysToReturn: 1,
        policyUrl: 'http://www.example.com',
      },
      fulfillmentInfo: {
        id: 'FULFILLMENT_SERVICE_ID',
        fulfillmentType: 'DELIVERY',
        expectedFulfillmentTime: {
          timeIso8601: '2019-09-25T18:00:00.877Z',
        },
        location: location,
        price: {
          type: 'REGULAR',
          name: 'Delivery Price',
          state: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            amountInMicros: 2000000,
          },
          taxIncluded: true,
        },
        fulfillmentContact: {
          email: 'johnjohnson@gmail.com',
          firstName: 'John',
          lastName: 'Johnson',
          displayName: 'John Johnson',
        },
      },
      purchaseLocationType: 'ONLINE_PURCHASE',
    },
  };
  // [END build_order_df]

  conv.ask('Transaction Decision Placeholder.');
  if (conv.contexts.get('google_payment')) {
    // [START ask_for_transaction_decision_google_payment_df]
    conv.ask(new TransactionDecision({
      orderOptions: {
        userInfoOptions: {
          userInfoProperties: [
            'EMAIL',
          ],
        },
      },
      paymentParameters: {
        googlePaymentOption: {
          // facilitationSpec is expected to be a serialized JSON string
          facilitationSpec: JSON.stringify({
            apiVersion: 2,
            apiVersionMinor: 0,
            merchantInfo: {
              merchantName: 'Example Merchant',
            },
            allowedPaymentMethods: [
              {
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: [
                    'AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'example',
                    gatewayMerchantId: 'exampleGatewayMerchantId',
                  },
                },
              },
            ],
            transactionInfo: {
              totalPriceStatus: 'FINAL',
              totalPrice: '15.77',
              currencyCode: 'USD',
            },
          }),
        },
      },
      presentationOptions: {
        actionDisplayName: 'PLACE_ORDER',
      },
      order: order,
    }));
    // [END ask_for_transaction_decision_google_payment_df]
  } else {
    // [START ask_for_transaction_decision_merchant_payment_df]
    conv.ask(new TransactionDecision({
      orderOptions: {
        userInfoOptions: {
          userInfoProperties: [
            'EMAIL',
          ],
        },
      },
      paymentParameters: {
        merchantPaymentOption: {
          defaultMerchantPaymentMethodId: '12345678',
          managePaymentMethodUrl: 'https://example.com/managePayment',
          merchantPaymentMethod: [
            {
              paymentMethodDisplayInfo: {
                paymentMethodDisplayName: 'VISA **** 1234',
                paymentType: 'PAYMENT_CARD',
              },
              paymentMethodGroup: 'Payment method group',
              paymentMethodId: '12345678',
              paymentMethodStatus: {
                status: 'STATUS_OK',
                statusMessage: 'Status message',
              },
            },
          ],
        },
      },
      presentationOptions: {
        actionDisplayName: 'PLACE_ORDER',
      },
      order: order,
    }));
    // [END ask_for_transaction_decision_merchant_payment_df]
  }
});

// Check result of asking to perform transaction / place order
app.intent('Transaction Decision Complete', (conv) => {
  // [START get_transaction_decision_df]
  const arg = conv.arguments.get('TRANSACTION_DECISION_VALUE');
  if (arg && arg.transactionDecision === 'ORDER_ACCEPTED') {
    console.log('Order accepted.');
    const order = arg.order;
  }
  // [END get_transaction_decision_df]
  if (arg && arg.transactionDecision === 'ORDER_ACCEPTED') {
    // [START create_order_df]
    // Set lastUpdateTime and update status of order
    const order = arg.order;
    order.lastUpdateTime = '2019-09-24T19:00:00.877Z';
    order.purchase.status = 'CONFIRMED';
    order.purchase.userVisibleStatusLabel = 'Order confirmed';

    // Send synchronous order update
    conv.ask(`Transaction completed! Your order`
    + ` ${conv.data.latestOrderId} is all set!`);
    conv.ask(new Suggestions('send order update'));
    conv.ask(new OrderUpdate({
      type: 'SNAPSHOT',
      reason: 'Reason string',
      order: order,
    }));
  // [END create_order_df]
  } else {
    conv.close('Transaction failed.');
  }
});

app.intent('Send Order Update', async (conv) => {
  const orderId = conv.data.latestOrderId;
  // [START order_update]
  // Import the 'googleapis' module for authorizing the request.
  const {google} = require('googleapis');
  // Import the 'request-promise' module for sending an HTTP POST request.
  const request = require('request-promise');
  // Import the OrderUpdate class from the Actions on Google client library.
  const {OrderUpdate} = require('actions-on-google');

  // Import the service account key used to authorize the request.
  // Replacing the string path with a path to your service account key.
  // i.e. const serviceAccountKey = require('./service-account.json')

  // Create a new JWT client for the Actions API using credentials
  // from the service account key.
  let jwtClient = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      ['https://www.googleapis.com/auth/actions.order.developer'],
      null,
  );

  // Authorize the client
  let tokens = await jwtClient.authorize();

  // Declare order update
  const orderUpdate = new OrderUpdate({
      updateMask: [
        'lastUpdateTime',
        'purchase.status',
        'purchase.userVisibleStatusLabel',
      ].join(','),
      order: {
        merchantOrderId: orderId, // Specify the ID of the order to update
        lastUpdateTime: new Date().toISOString(),
        purchase: {
          status: 'DELIVERED',
          userVisibleStatusLabel: 'Order delivered',
        },
      },
      reason: 'Order status updated to delivered.',
  });

  // Set up the PATCH request header and body,
  // including the authorized token and order update.
  let options = {
    method: 'PATCH',
    uri: `https://actions.googleapis.com/v3/orders/${orderId}`,
    auth: {
      bearer: tokens.access_token,
    },
    body: {
      header: {
        isInSandbox: true,
      },
      orderUpdate,
    },
    json: true,
  };

  // Send the PATCH request to the Orders API.
  try {
    await request(options);
    conv.close(`The order has been updated.`);
  } catch (e) {
    console.log(`Error: ${e}`);
    conv.close(`There was an error sending an order update.`);
  }
  // [END order_update]
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
