# feathers-pouchdb

[![Dependency Status](https://img.shields.io/david/endyjasmi/feathers-pouchdb.svg?style=flat-square)](https://david-dm.org/endyjasmi/feathers-pouchdb)
[![Download Status](https://img.shields.io/npm/dm/feathers-pouchdb.svg?style=flat-square)](https://www.npmjs.com/package/feathers-pouchdb)

> Create a [PouchDB](https://pouchdb.com/) service for [FeatherJS](https://feathersjs.com/).

## Installation

```
npm install pouchdb-core pouchdb-find pouchdb-adapter-leveldb feathers-pouchdb --save
```

## Documentation

Please refer to the [Feathers database adapter documentation](https://docs.feathersjs.com/api/databases/common.html) for more details or directly at:

- [PouchDB](https://pouchdb.com/api.html) - The detailed documentation for this adapter
- [Extending](https://docs.feathersjs.com/api/databases/common.html#extending-adapters) - How to extend a database adapter
- [Pagination and Sorting](https://docs.feathersjs.com/api/databases/common.html#pagination) - How to use pagination and sorting for the database adapter
- [Querying](https://docs.feathersjs.com/api/databases/querying.html) - The common adapter querying mechanism

### Limitation
- Currently this plugin **DOES NOT** fully support pagination because of the way CouchDB Mango Query is designed to make use map reduce index. The skip and limit does work though, just not the total attribute though.

## Complete Example

Here's an example of a Feathers server that uses `feathers-pouchdb`. 

```js
const PouchDBCore = require('pouchdb-core');
const PouchDBFind = require('pouchdb-find');
const PouchDBLevelDBAdapter = require('pouchdb-adapter-leveldb');
const feathers = require('feathers');
const rest = require('feathers-rest');
const hooks = require('feathers-hooks');
const bodyParser = require('body-parser');
const errorHandler = require('feathers-errors/handler');
const service = require('feathers-pouchdb');

const PouchDB = PouchDBCore.plugin(PouchDBLevelDBAdapter)
  .plugin(PouchDBFind);

// Initialize the application
const app = feathers()
  .configure(rest())
  .configure(hooks())
  // Needed for parsing bodies (login)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // Initialize your feathers service
  .use('/messages', service({ Model: new PouchDB('./messages') }))
  .use(errorHandler());

app.listen(3030);

console.log('Feathers app started on 127.0.0.1:3030');
```

You can run this example and going to [localhost:3030/messages](http://localhost:3030/messages). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new messages service.

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).
