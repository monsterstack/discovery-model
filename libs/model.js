'use strict';

const config = require('config');
const DB = config.db.name;
const thinky = require('thinky')({host: config.db.host, port: config.db.port, db: DB});
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
  region: String,
  stage: String,
  rtimes: Array,
  avgTime: Number
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
  console.log(doc);
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

const allServices = (stageFilter, regionFilter, pageDescriptor) => {
  let filter = {};
  if(stageFilter)
    filter.stage = stageFilter;
  if(regionFilter)
    filter.region = regionFilter;
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = pageDescriptor.size *1;
  }

  return ServiceDescriptor.filter(filter).slice(skip, limit).then((docs) => {
    return {
      page: pageDescriptor,
      elements: docs
    }
  });
}

const findServicesByType = (type, stageFilter, regionFilter, pageDescriptor) => {
  // Need a more nuanced query here.  Need to take into account 'stageFilter', 'regionFilter',
  // and pageDescriptor data (i.e. pageNumber and size)
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = pageDescriptor.size *1;
  }

  let filter = {
    type: type
  }

  if(stageFilter) {
    filter.stage = stageFilter;
  }

  if(regionFilter) {
    filter.regionFilter = regionFilter;
  }

  return ServiceDescriptor.filter(filter).slice(skip, limit).then((docs) => {
    return {
      page: pageDescriptor,
      elements: docs
    }
  });
}

const findServicesByTypes = (types, stageFilter, regionFilter, pageDescriptor) => {
  // Need a more nuanced query here.  Need to take into account 'stageFilter', 'regionFilter',
  // and pageDescriptor data (i.e. pageNumber and size)
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = pageDescriptor.size *1;
  }

  let filter = {};
  if(stageFilter) {
    filter.stage = stageFilter;
  }

  if(regionFilter) {
    filter.region = regionFilter;
  }

  let performFiltering = false;
  if(filter.hasOwnProperty('stage') || filter.hasOwnProperty('region')) {
    return ServiceDescriptor.filter(filter, (service) => {
      return thinky.r.expr(types).contains(service("type"));
    }).slice(skip, limit).then((docs) => {
      return {
        page: pageDescriptor,
        elements: docs
      }
    });
  } else {
    return ServiceDescriptor.filter((service) => {
      return thinky.r.expr(types).contains(service("type"));
    }).slice(skip, limit).then((docs) => {
      return {
        page: pageDescriptor,
        elements: docs
      }
    });
  }
}

const findServiceById = (id) => {
  return ServiceDescriptor.get(id);
}

const saveService = (service) => {
  let descriptor = new ServiceDescriptor(service);
  if(descriptor.status === undefined) {
    descriptor.status = STATUS_ONLINE;
  }
  service.timestamp = new Date();
  return descriptor.save();
}

const updateService = (service) => {
  return ServiceDescriptor.get(service.id).then((svc) => {
    if(svc.status === undefined) {
      svc.status = STATUS_ONLINE;
    }
    svc.timestamp = new Date();
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
  let myFeed = ServiceDescriptor.filter((service) => {
    return thinky.r.expr(serviceTypes).contains(service("type"));
  }).changes({ includeInitial: true });

  myFeed.then((feed) => {
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
  }).error((err) => {
    console.log(err);
  });

  return myFeed;
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

const STATUS_ONLINE = "Online";
const STATUS_OFFLINE = "Offline";

exports.STATUS_ONLINE;
exports.STATUS_OFFLINE;
