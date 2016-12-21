'use strict';
const assert = require('assert');
const model = require('../index.js').model;
const db = model.r;

/**
 * Discovery model
 * Test connection to Data Store.
 */
describe('discovery-model', () => {
  before(() => {

  });

  it('creates db when connected', () => {
    model.connect({host: 'localhost', port: 28015}, 'tinkle').then((db) => {
      assert(db != null, 'db is not null');
    }).catch((err) => {
      assert(err === null, 'connect did not fail');
    });
  });

  after(() => {

  });
});
