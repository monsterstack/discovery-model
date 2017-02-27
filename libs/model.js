'use strict';

const config = require('config');
const DB = config.db.name;
const thinky = require('thinky')({
  host: config.db.host, 
  port: config.db.port, 
  max: 25,
  buffer: 5,
  db: DB
});
const type = thinky.type;

const Promise = require('promise');

const ServiceDescriptor = thinky.createModel("ServiceDescriptor", {
  id: String,
  class: String,
  version: String,
  endpoint: String,
  type: String,
  healthCheckRoute: String,
  schemaRoute: String,
  schemaPath: String,
  docsPath: String,
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
  console.log(`Saved ${doc.isSaved() && doc.getOldValue() == null}`);
  console.log(`Deleted ${doc.isSaved() === false && doc.getOldValue() === undefined}`);
  return {
    record: doc,
    change: doc,
    deleted: (doc.isSaved() === false && doc.getOldValue() === undefined),
    isNew: (doc.isSaved() && doc.getOldValue() === null)
  };
}

/**
 * Filter scan
 */
const filterScan = (types, filter, service) => {
  let val = false;
  if(types) {
    if(filter.hasOwnProperty('stage') && filter.hasOwnProperty('region') && filter.hasOwnProperty('status')) {
      console.log(`${filter.stage} - ${filter.region} - ${filter.status}`);
      val = thinky.r.expr(types).contains(service("type"))
        .and(service("stage").eq(filter.stage))
        .and(service("region").eq(filter.region))
        .and(service("status").eq(filter.status));
    } else if(filter.hasOwnProperty('region') && filter.hasOwnProperty("status")) {
      console.log(`${filter.region} - ${filter.status}`);
      val = thinky.r.expr(types).contains(service("type"))
        .and(service("region").eq(filter.region))
        .and(service("status").eq(filter.status));
    } else if(filter.hasOwnProperty('region') && filter.hasOwnProperty('stage')) {
      console.log(`${filter.stage} - ${filter.region}`);
      val = thinky.r.expr(types).contains(service("type"))
        .and(service("region").eq(filter.region))
        .and(service("stage").eq(filter.stage));
    } else if(filter.hasOwnProperty('region')) {
      console.log(`${filter.region}`);
      val = thinky.r.expr(types).contains(service("type"))
      .and(service("region").eq(filter.region));
    } else if(filter.hasOwnProperty('status')) {
      console.log(`${filter.status}`);
      val = thinky.r.expr(types).contains(service("type"))
      .and(service("status").eq(filter.status));
    } else if(filter.hasOwnProperty('stage')) {
      console.log(`${filter.stage}`);
      val = thinky.r.expr(types).contains(service("type"))
      .and(service("stage").eq(filter.stage));
    } else {
      console.log('All');
      val = thinky.r.expr(types).contains(service("type"));
    }
  } else {
    val = thinky.r.expr(types).contains(service("type"));
  }
  return val;
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

const allServices = (stageFilter, regionFilter, statusFilter, pageDescriptor) => {
  let filter = {};
  if(stageFilter)
    filter.stage = stageFilter;
  if(regionFilter)
    filter.region = regionFilter;
  if(statusFilter)
    filter.status = statusFilter;
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = skip + pageDescriptor.size *1;
  }

  return ServiceDescriptor.filter(filter).slice(skip, limit).then((docs) => {
    return {
      page: pageDescriptor,
      elements: docs
    }
  });
}

const countServices = (types, stageFilter, regionFilter, statusFilter) => {
  let filter = {};
  if(stageFilter) {
    filter.stage = stageFilter;
  }
  if(regionFilter) {
    filter.region = regionFilter;
  }
  if(statusFilter) {
    filter.status = statusFilter;
  }
  if(types) {
    console.log("Checking with types");
    if(filter.hasOwnProperty("stage") || filter.hasOwnProperty("region") || filter.hasOwnProperty("status")) {
      return ServiceDescriptor.filter((service) => {
        return filterScan(types, filter, service);
      }).run().then((services) => {
        return {
          count: services.length
        }
      });
    } else {
      return ServiceDescriptor.filter((service) => {
        return thinky.r.expr(types).contains(service("type"));
      }).run().then((services) => {
        return {
          count: services.length
        }
      });
    }
  } else {
    if(filter.hasOwnProperty("stage") || filter.hasOwnProperty("region") || filter.hasOwnProperty("status")) {
      return ServiceDescriptor.filter(filter).count().execute().then((count) => {
        return {
          count: count
        }
      });
    } else {
      return ServiceDescriptor.filter({}).run().then((services) => {
        return {
          count: services.length
        }
      });
    }
  }
}

const markWorkersOffline = () => {
  let p = new Promise((resolve, reject) => {
    ServiceDescriptor.filter({class: 'Worker'}).then((services) => {
      services.forEach((service) => {
        service.merge({status: 'Offline'}).save();
      })
    })
  });
  return p;
}

const markWorkersOnline = () => {
  let p = new Promise((resolve, reject) => {
    ServiceDescriptor.filter({class: 'Worker'}).then((services) => {
      services.forEach((service) => {
        service.merge({status: 'Online'}).save();
      })
    })
  });
  return p;
}

const findServicesByType = (type, stageFilter, regionFilter, statusFilter, pageDescriptor) => {
  // Need a more nuanced query here.  Need to take into account 'stageFilter', 'regionFilter',
  // and pageDescriptor data (i.e. pageNumber and size)
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = skip + pageDescriptor.size *1;
  }

  let filter = {
    type: type
  }

  if(stageFilter) {
    filter.stage = stageFilter;
  }

  if(regionFilter) {
    filter.region = regionFilter;
  }

  if(statusFilter) {
    filter.status = statusFilter;
  }

  return ServiceDescriptor.filter(filter).slice(skip, limit).then((docs) => {
    return {
      page: pageDescriptor,
      elements: docs
    }
  });
}

const findServicesByTypes = (types, stageFilter, regionFilter, statusFilter, pageDescriptor) => {
  // Need a more nuanced query here.  Need to take into account 'stageFilter', 'regionFilter',
  // and pageDescriptor data (i.e. pageNumber and size)
  let skip = 0;
  let limit = 100;
  if(pageDescriptor) {
    skip = pageDescriptor.page * pageDescriptor.size;
    limit = skip + (pageDescriptor.size *1);
  }

  let filter = {};
  if(stageFilter) {
    filter.stage = stageFilter;
  }

  if(regionFilter) {
    filter.region = regionFilter;
  }

  if(statusFilter) {
    filter.status = statusFilter;
  }
  console.log(`Slice ${skip} ${limit}`);
  let performFiltering = false;
  if(filter.hasOwnProperty('stage') || filter.hasOwnProperty('region') || filter.hasOwnProperty('status')) {
    return ServiceDescriptor.filter((service) => {
      return filterScan(types, filter, service);
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

const findUniqueServiceTypes = (type) => {
  return ServiceDescriptor.pluck("type").distinct();
}

const findServiceById = (id) => {
  return ServiceDescriptor.get(id);
}

const findServiceByEndpoint = (endpoint) => {
  return ServiceDescriptor.filter({"endpoint": endpoint}).then((docs) => {
    if(docs.length > 0) {
      return docs[0];
    } else {
      return null;
    }
  });
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
  }).changes({squash: true});

  myFeed.then((feed) => {
    feed.each((err, doc) => {
      if(err) {
        debug("Received err from feed");
        debug(err);
        cb(err, null);
      } else {
        debug("Received document from feed");
        debug(doc);
        if(doc) {
          cb(null, makeChangeNotification(doc));
        }
      }
    });
  }).error((err) => {
    console.log(err);
  });

  return myFeed;
}

/**
 * Delete Service
 * @param service to delete
 */
const deleteService = (service) => {
  if((typeof service) === "string" ) {
    return ServiceDescriptor.get(service).then((service) => {
      service.delete();
      return service;
    });
  } else {
    return ServiceDescriptor.get(service.id).then((service) => {
      service.delete();
      return service;
    });
  }
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
exports.countServices = countServices;
exports.findUniqueServiceTypes = findUniqueServiceTypes;
exports.findServiceByEndpoint = findServiceByEndpoint;

exports.markWorkersOffline = markWorkersOffline;
exports.markWorkersOnline = markWorkersOnline;

const STATUS_ONLINE = "Online";
const STATUS_OFFLINE = "Offline";

exports.STATUS_ONLINE = STATUS_ONLINE;
exports.STATUS_OFFLINE = STATUS_OFFLINE;
