'use strict';

const DB = 'cdsp';

const thinky = require('thinky')({host: 'localhost', port: 28015, db: DB});
const type = thinky.type;

const Promise = require('promise');

const ServiceDescriptor = thinky.createModel("ServiceDescriptor", {
  id: String,
  version: String,
  endpoint: String,
  type: String,
  healthCheckRoute: String,
  schemaRoute: String,
  docsRoute: String,
  timestamp: Date,
  status: String,
  rtimes: Array
});

const debug = require('debug')('discovery-model');

// Make sure that an index on date is available
ServiceDescriptor.ensureIndex("type");

/**
 * Utility for building a change notification
 */
const makeChangeNotification = (doc) => {
  /* The actual value of the document is wrapped in a `model` - need to find best way to strip
   * it out of the document object and assign the change to the value
   * Accessing the underlying record (i.e. doc) will allow you to `closeFeed()`
   */
  return { record: doc, change: doc, deleted: doc.isSaved() == false, isNew: doc.getOldValue() === null };
}

const connect = (options, dbName) => {
  let db = thinky.r;
  let p = new Promise((reject, resolve) => {
    db.connect(options, (err, conn) => {
      assert(err === null);
      assert(conn, 'connection is not null');
      if(err) reject(err);
      else resolve(conn.db(dbName || DB));
    });
  });
  return p;
}

const findServicesByType = (type) => {
  return ServiceDescriptor.filter({type: type});
}

const findServicesByTypes = (types) => {
  return ServiceDescriptor.filter((service) => {
    return thinky.r.expr(types).contains(service("type"));
  });
}

const findServiceById = (id) => {
  return ServiceDescriptor.get(id);
}

const saveService = (service) => {
  let descriptor = new ServiceDescriptor(service);
  return descriptor.save();
}

const updateService = (service) => {
  return ServiceDescriptor.get(service.id).then((svc) => {
    svc.merge(service).save();
    return svc;
  });
}

/**
 * Change feed for notifications when a services of interest have `changed`
 * Resulting document holds reference to the record.  Use the record to close the
 * feed when no longer required.
 * @params types Array of service types
 * @param  cb Callback(err, changeNotification)
 *
 * Example
 * notification.record.closeFeed();
 *
 * @see makeChangeNotification
 */
const onServiceChange = (serviceTypes, cb) => {
  ServiceDescriptor.filter((service) => {
    return thinky.r.expr(serviceTypes).contains(service("type"));
  }).changes().then((feed) => {
    feed.each((err, doc) => {
      if(err) {
        debug("Received err from feed");
        debug(err);
        cb(err, null);
      } else {
        debug("Received document from feed");
        debug(doc);
        if(doc)
          cb(null, makeChangeNotification(doc));
      }
    });
  });
}

const allServices = () => {
  return ServiceDescriptor.filter({});
}

const deleteService = (service) => {
  return ServiceDescriptor.get(service.id).then((service) => {
    service.delete();
    return service;
  });
}

exports.ServiceDescriptor = ServiceDescriptor;
exports.r = thinky.r;
exports.connect = connect;

exports.saveService = saveService;
exports.updateService = updateService;
exports.allServices = allServices;
exports.findServicesByType = findServicesByType;
exports.findServicesByTypes = findServicesByTypes;
exports.findServiceById = findServiceById;
exports.deleteService = deleteService;
exports.onServiceChange = onServiceChange;

exports.STATUS_ONLINE = "Online";
exports.STATUS_OFFLINE = "Offline";
