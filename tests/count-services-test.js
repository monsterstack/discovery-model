'use strict';
const assert = require('chai').assert;
const model = require('../index.js').model;
const db = model.r;

/**
 * Discovery model
 * Test connection to Data Store.
 */
describe('discovery-model:count', () => {
  before((done) => {
    done();
  });

  it('count returned when called', () => {
    model.countServices().then((count) => {
      assert(count != null, 'count is not null');
      assert(count.count >= 0, 'count is not negative');
      done();
    }).catch((err) => {
      assert(err === null, 'count did not fail');
      done(err);
    });
  });

  after(() => {

  });
});
