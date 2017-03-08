'use strict';
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

  it('count returned when called', (done) => {
    model.countServices(['FooService']).then((count) => {
      console.log(count);
      if(count.count > 0) 
        done(new Error('Expected `0` count'));
      else 
        done();
    }).error((err) => {
      done(err);
    });
  });

  after(() => {

  });
});
