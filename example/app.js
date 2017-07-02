const PouchDBCore = require('pouchdb-core');
const PouchDBFind = require('pouchdb-find');
const PouchDBLevelDBAdapter = require('pouchdb-adapter-leveldb');
const bodyParser = require('body-parser');
const errorsHandler = require('feathers-errors/handler');
const feathers = require('feathers');
const rest = require('feathers-rest');
const service = require('../lib');
const socketio = require('feathers-socketio');

const PouchDB = PouchDBCore.plugin(PouchDBLevelDBAdapter)
  .plugin(PouchDBFind);

const app = feathers()
  .configure(rest())
  .configure(socketio())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }));

app.use('/messages', service({
  Model: new PouchDB('messages')
}));

app.service('messages').create({
  text: 'Oh hai!'
}).then(function (message) {
  console.log('Created message', message);
});

app.use(errorsHandler());

const port = 3030;

app.listen(port, function () {
  console.log(`Feathers server listening on port ${port}`);
})
