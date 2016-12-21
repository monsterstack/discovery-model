'use strict';

const DB = 'cdsp';

const thinky = require('thinky')({host: 'localhost', port: 28015, db: DB});
const type = thinky.type;

const Promise = require('promise');

const ServiceDescriptor = thinky.createModel("ServiceDescriptor", {
  id: String,
  endpoint: String,
  type: String,
  healthCheckRoute: String,
  timestamp: Date,
  state: String
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

const findServiceByType = (type) => {
  return ServiceDescriptor.filter({type: type});
}

const saveService = (service) => {
  let descriptor = new ServiceDescriptor(service);
  return descriptor.save();
}

/**
 * Change feed for notifications when a service of interest has `changed`
 * Resulting document holds reference to the record.  Use the record to close the
 * feed when no longer required.
 *
 * Example
 * notification.record.closeFeed();
 *
 * @see makeChangeNotification
 */
const onServiceChange = (params, cb) => {
  ServiceDescriptor.filter(params).changes().then((feed) => {

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

exports.ServiceDescriptor = ServiceDescriptor;
exports.r = thinky.r;
exports.connect = connect;

exports.saveService = saveService;
exports.findServiceByType = findServiceByType;
exports.onChange = onChange;
