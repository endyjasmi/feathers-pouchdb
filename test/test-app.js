const PouchDBCore = require('pouchdb-core');
const PouchDBFind = require('pouchdb-find');
const PouchDBMemoryAdapter = require('pouchdb-adapter-memory');
const feathers = require('feathers');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');
const bodyParser = require('body-parser');
const service = require('../lib');

const PouchDB = PouchDBCore.plugin(PouchDBMemoryAdapter)
  .plugin(PouchDBFind);

const todoService = service({
  Model: new PouchDB('todos'),
  paginate: {
    default: 2,
    max: 4
  }
});

const app = feathers()
  .configure(rest())
  .configure(socketio())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use('/todos', todoService);

todoService.Model.createIndex({
  index: {
    fields: ['text']
  }
});

const port = 3030;
module.exports = app.listen(port, function () {
  console.log(`Feathers server listening on port ${port}`);
});
