/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const ava = require('ava');
const fulfillment = require('../index').dialogflowFirebaseFulfillment;

fs.readdirSync(__dirname).forEach((fileName) => {
  if (fs.lstatSync(path.join(__dirname, fileName)).isDirectory()) {
    ava.cb(fileName, (t) => {
      const req = {
        get() {},
        body: require(`./${fileName}/req.json`),
        headers: {},
      };
      const resBody = require(`./${fileName}/res.json`);

      const res = {
        setHeader: function() {
          return this;
        },
        status: function(code) {
          return this;
        },
        send: function(body) {
          t.deepEqual(JSON.parse(JSON.stringify(body)), resBody);
          t.end();
          return this;
        },
      };

      fulfillment(req, res);
    });
  }
});
