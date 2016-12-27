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
      version: '2.0'
    };

    console.log(descriptor);
    model.saveService(descriptor).then((result) => {
      console.log("Yeah')");
      console.log(result);
      assert(result != null, "Descriptor was saved");
      done();
    }).error((err) => {
      console.log("Error");
      console.log(err);
      assert(err === null, "Failure did not occur");
      done();
    });
  });

  after(() => {

  });
});
