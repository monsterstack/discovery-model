'use strict';

const uuid = require('uuid');
const assert = require('chai').assert;
const model = require('../index.js').model;


/**
 * Discovery model
 * Find service
 */
describe('discovery-model:find-unique', () => {
  let type = `p${uuid.v1()}`;
  let id = uuid.v1();
  before((done) => {
    let descriptor = {
      endpoint: 'http://google.com',
      type: type,
      healthCheckRoute: '/',
      schemaRoute: '/schema',
      timestamp: new Date(),
      id: id,
      region: 'us-east-1',
      stage: 'dev',
      status: 'Online',
      version: '2.0'
    };

    model.saveService(descriptor).then((result) => {
      assert(result, "Descriptor was saved");
      done();
    }).error((err) => {
      assert(err === null, "Failure did not occur");
      done();
    });
  });

  it('descriptor retrieved unique service types', (done) => {
    console.log(type);
    model.findUniqueServiceTypes().then((result) => {
      console.log(result);
      assert(result, "Result is not null");
      console.log(result);
      done();
    }).error((err) => {
      console.log(err);
      assert(err === null, "No error occurred");
      done();
    })
  });

  after(() => {

  });
});
