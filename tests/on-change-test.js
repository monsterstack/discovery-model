'use strict';
const debug = require('debug')('on-change-event-test');
const uuid = require('uuid');
const assert = require('assert');
const model = require('../index.js').model;


/**
 * Discovery model
 * On-Change test
 */
describe('discovery-model', () => {
  let type = `p${uuid.v1()}`;
  let descriptor = {
    endpoint: 'http://foo.org/foos',
    type: 'FooService',
    healthCheckRoute: '/health',
    timestamp: new Date(),
    id: uuid.v1(),
    status: 'Online'
  };

  before((done) => {
    done();
  });

  it('change received when record added', function(done) {
    this.timeout(9000);
    model.onServiceChange(['FooService'], (err, change) => {
      debug("Received change");
      debug(change);
      assert(change, "Result is not null");
      done();
    });

    setTimeout( () => {
      model.saveService(descriptor).then((result) => {
        assert(result, "Descriptor was saved");
      }).error((err) => {
        assert(err === null, "Failure did not occur");
      });
    }, 5000);
  });

  after(() => {

  });
});
