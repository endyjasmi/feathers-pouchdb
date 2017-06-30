const PouchDBCore = require('pouchdb-core');
const PouchDBFind = require('pouchdb-find');
const PouchDBLevelDBAdapter = require('pouchdb-adapter-leveldb');
const feathers = require('feathers');
const service = require('../lib');

const PouchDB = PouchDBCore.plugin(PouchDBLevelDBAdapter)
  .plugin(PouchDBFind);

const app = feathers();
app.use('/logs', service({
  Model: new PouchDB('logs')
}));

const logService = app.service('/logs');

// Create single log
const log = {
  time: new Date().toISOString()
};
logs.create(log)
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Create single log with selector
const selector = {
  query: {
    $select: ['time']
  }
};
log.create(log, selector)
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Create multiple log
const logs = [
  { time: new Date().toISOString() },
  { time: new Date().toISOString() },
  { time: new Date().toISOString() }
];
logs.create(logs)
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Create multiple log with selector
log.create(logs, selector)
  .then(result => console.log(result))
  .catch(error => console.error(error));
