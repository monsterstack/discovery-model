'use strict';
const config = require('config');
const DB = config.db.name;

const model = require('./index').model;

let myFeed = model.ServiceDescriptor.filter((service) => {
  return model.r.expr(['SecurityService']).contains(service("type"));
}).changes({squash: true});

myFeed.then((feed) => {
  feed.each((err, doc) => {
    if(doc) {
      console.log(doc);
    }
  });
});
