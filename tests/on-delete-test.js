'use strict';
const debug = require('debug')('on-change-event-test');
const uuid = require('uuid');
const assert = require('chai').assert;
const model = require('../index.js').model;


const newDescriptor = (id) => {
    return {
    endpoint: 'http://foo.org/foos',
    type: 'FooService',
    healthCheckRoute: '/health',
    schema: '/schema',
    timestamp: new Date(),
    region: 'us-east-1',
    id: id,
    stage: 'dev',
    status: 'Online',
    version: '2.0'
  };
}

/**
 * Discovery model
 * On-Change test
 */
describe('discovery-model:delete', () => {

  before((done) => {
    done();
  });

  it('change received when record deleted', function(done) {
    let count = 0;
    model.onServiceChange(['FooService','BarService'], (err, change) => {
        debug(`Deleted record event => ${change.deleted}`);
        debug(change);
        debug("Received change");
        if(change.deleted) {
            count = count+1;
        }
        if(count == 6)
            done();
    });

    let ids = [
        uuid.v1(),
        uuid.v1(),
        uuid.v1(),
        uuid.v1(),
        uuid.v1(),
        uuid.v1()
    ];

    model.saveService(newDescriptor(ids[0])).then(() => {
        return model.saveService(newDescriptor(ids[1]));
    }).then(() => {
        return model.saveService(newDescriptor(ids[2]));
    }).then(() => {
        return model.saveService(newDescriptor(ids[3]));
    }).then(() => {
        return model.saveService(newDescriptor(ids[4]));
    }).then(() => {
        return model.saveService(newDescriptor(ids[5]));
    }).then(() => {
        return model.deleteService({id: ids[0]});
    }).then(() => {
        return model.deleteService(ids[1]);
    }).then(() => {
        return model.deleteService({id: ids[2]});
    }).then(() => {
        return model.deleteService({id: ids[3]});
    }).then(() => {
        return model.deleteService({id: ids[4]});
    }).then(() => {
        return model.deleteService({id: ids[5]});
    }).error((err) => {
        done(err);
    });   

    
  }).timeout(21000);

  after((done) => {
    model.ServiceDescriptor.filter({type: "FooService"}).then((docs) => {
      docs.forEach((doc) => {
        doc.delete();
      });
      done();
    });
  });
});
