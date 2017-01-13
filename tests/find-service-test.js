'use strict';

const uuid = require('uuid');
const assert = require('chai').assert;
const model = require('../index.js').model;


/**
 * Discovery model
 * Find service
 */
describe('discovery-model:find', () => {
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

  it('descriptor retrieved when requested', (done) => {
    console.log(type);
    model.findServicesByType(type, null, null, {page:0, size:10}).then((result) => {
      console.log(result);
      assert(result, "Result is not null");
      assert(result.elements.length > 0, "Result is not empty");
      console.log(result);
      done();
    }).error((err) => {
      console.log(err);
      assert(err === null, "No error occurred");
      done();
    })
  });

  it('descriptor retrieved by id when requested', (done) => {
    model.findServiceById(id).then((result) => {
      assert(result, "Result is not null");
      done();
    }).error((err) => {
      assert(err === null, "No error occured");
      done();
    });
  })

  after(() => {

  });
});
