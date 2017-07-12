import PouchDBCore from 'pouchdb-core';
import PouchDBFind from 'pouchdb-find';
import PouchDBMemoryAdapter from 'pouchdb-adapter-memory';
import assert from 'assert';
import errors from 'feathers-errors';
import feathers from 'feathers';
import { base } from 'feathers-service-tests';
import { expect } from 'chai';

// import server from './test-app';
import service from '../src';

const PouchDB = PouchDBCore.plugin(PouchDBMemoryAdapter)
  .plugin(PouchDBFind);

function createService (name, options) {
  return service(Object.assign({
    Model: new PouchDB(name)
  }, options));
}

describe('feathers-pouchdb', () => {
  const app = feathers()
    .use('/people', createService('people', {
      events: ['testing']
    }))
    .use('/people-customid', createService('people-customid', {
      events: ['testing']
    }));

  before(done => {
    app.service('people').Model.createIndex({ index: { fields: ['name', 'age'] } })
      .then(() => done())
      .catch(error => done(error));
  });

  describe('Initialization', () => {
    it('throws and error when missing options', () =>
      expect(service.bind(null)).to
      .throw('PouchDB datastore `Model` needs to be provided'));

    it('throws an error when missing a Model', () =>
      expect(service.bind(null, {})).to
      .throw('PouchDB datastore `Model` needs to be provided'));
  });

  describe('Common functionality', () => {
    it('is CommonJS compatible', () =>
      assert.ok(typeof require('../lib') === 'function'));

    base(app, errors, 'people', '_id');
  });
});
