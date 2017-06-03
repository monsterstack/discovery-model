'use strict';

const uuid = require('uuid');
const assert = require('chai').assert;
const model = require('../index.js').model;

/**
 * Discovery model
 * Announce Service
 */
describe('discovery-model:announce', () => {
  before((done) => {
    done();
  });

  it('descriptor created when saved', (done) => {
    let descriptor = {
      endpoint: 'http://foo.org/players',
      type: 'PlayersService',
      healthCheckRoute: '/health',
      schemaRoute: '/schema',
      timestamp: new Date(),
      id: uuid.v1(),
      region: 'us-east-1',
      stage: 'dev',
      version: '2.0'
    };

    model.saveService(descriptor).then((result) => {
      assert(result != null, "Descriptor was saved");
      done();
    }).error((err) => {
      assert(err === null, "Failure did not occur");
      done();
    });
  });

  after(() => {

  });
});
