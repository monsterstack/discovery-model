'use strict';
const debug = require('debug')('on-change-event-test');
const uuid = require('uuid');
const assert = require('chai').assert;
const model = require('../index.js').model;


/**
 * Discovery model
 * On-Change test
 */
describe('discovery-model:change', () => {
  let type = `p${uuid.v1()}`;
  let descriptor = {
    endpoint: 'http://foo.org/foos',
    type: 'FooService',
    healthCheckRoute: '/health',
    schema: '/schema',
    timestamp: new Date(),
    id: uuid.v1(),
    region: 'us-east-1',
    stage: 'dev',
    status: 'Online',
    version: '2.0'
  };

  before((done) => {
    done();
  });

  it('change received when record added / updated / deleted', function(done) {
    this.timeout(12000);
    let count = 0;
    model.onServiceChange(['FooService','BarService'], (err, change) => {
      debug("Received change");
      assert(change, "Result is not null");
      count = count+1;
      if(count == 3)
        done();
    });

    setTimeout( () => {
      model.saveService(descriptor).then((result) => {
        assert(result, "Descriptor was saved");
        descriptor.status = 'Offline';
        model.updateService(descriptor).then((result) => {
          model.deleteService(descriptor.id).then((result) => {
            assert(result, "Descriptor was saved");
          }).error((err) => {
            console.log(err);
            assert(err === null, "Failure did not occur");
          });
        });
      }).error((err) => {
        assert(err === null, "Failure did not occur");
      });
    }, 5000);

    setTimeout( () => {
      if(count === 4) {
        done();
      } else {
        done(new Error("Missing Change Event"));
      }
    }, 7000);

  });

  after(() => {
    model.ServiceDescriptor.filter({type: "FooService"}).then((docs) => {
      console.log("db cleared");
      docs.forEach((doc) => {
        doc.delete();
      });
    });
  });
});
