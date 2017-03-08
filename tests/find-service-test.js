'use strict';

const uuid = require('uuid');
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
      done();
    }).error((err) => {
      
      done(err);
    });
  });

  it('descriptor retrieved when requested', (done) => {
    console.log(type);
    model.findServicesByType(type, null, null, {page:0, size:10}).then((result) => {
      console.log(result);
      if(result === undefined)
        done(new Error('Expecting defined result'));
      else 
        done();
    }).error((err) => {
      console.log(err);
      done(err);
    })
  });

  it('descriptor retrieved by id when requested', (done) => {
    model.findServiceById(id).then((result) => {
      done();
    }).error((err) => {
      done(err);
    });
  })

  after(() => {

  });
});
