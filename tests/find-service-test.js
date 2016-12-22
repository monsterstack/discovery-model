'use strict';

const uuid = require('uuid');
const assert = require('assert');
const model = require('../index.js').model;


/**
 * Discovery model
 * Find service
 */
describe('discovery-model', () => {
  let type = `p${uuid.v1()}`;
  before((done) => {
    let descriptor = {
      endpoint: 'http://foo.org/players',
      type: type,
      healthCheckRoute: '/health',
      timestamp: new Date(),
      id: uuid.v1(),
      status: 'Online'
    };

    model.saveService(descriptor).then((result) => {
      assert(result, "Descriptor was saved");
      done();
    }).error((err) => {
      assert(err === null, "Failure did not occur");
      done();
    });
  });

  it('descriptor retrieved when requested', (done) => {
    console.log(type);
    model.findServicesByType(type).then((result) => {
      console.log(result);
      assert(result, "Result is not null");
      assert(result.length > 0, "Result is not empty");
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
