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

// // Create single log
// const log = {
//   time: new Date().toISOString()
// };
// logService.create(log)
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

// // Create single log with selector
// const selector = {
//   query: {
//     $select: ['time']
//   }
// };
// logService.create(log, selector)
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

// // Create multiple log
// const logs = [
//   { time: new Date().toISOString() },
//   { time: new Date().toISOString() },
//   { time: new Date().toISOString() }
// ];
// logService.create(logs)
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

// // Create multiple log with selector
// logService.create(logs, selector)
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

// // Find all logs
// logService.find({ query: { time: {$gt: '2017-07-01T01:57'}}})
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

// Get single record
logService.get('F2EFB5D5-5F6E-1BD5-A2DC-7328D7A41EF1', { query: { $select: ['_rev']}})
  .then(result => console.log(result))
  .catch(error => console.error(error));
