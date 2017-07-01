import PouchDBCore from 'pouchdb-core';
import PouchDBFind from 'pouchdb-find';
import PouchDBMemoryAdapter from 'pouchdb-adapter-memory';
import assert from 'assert';
import errors from 'feathers-errors';
import feathers from 'feathers';
import { base } from 'feathers-service-tests';
import { expect } from 'chai';

import service from '../src';

const PouchDB = PouchDBCore.plugin(PouchDBMemoryAdapter)
  .plugin(PouchDBFind);

function createService (name, options) {
  return service(Object.assign({
    Model: new PouchDB(name)
  }, options)).extend({

    find (params) {
      params = params || {};
      params.query = typeof params.query === 'object' ? params.query : {};
      if (params.query.$sort) {
        for (let sortField in params.query.$sort) {
          if (!params.query[sortField]) {
            params.query[sortField] = { $gte: null };
          }
        }
      }
      return this._super.apply(this, arguments);
    }

  });
}

describe('feathers-pouchdb', () => {
  const app = feathers()
    .use('/people', createService('people', {
      events: ['testing']
    }))
    .use('/people-customid', createService('people-customid', {
      id: 'customid',
      events: ['testing']
    }));

  before(done => {
    app.service('people').Model.createIndex({ index: { fields: ['name'] } })
      .then(() => app.service('people-customid').Model.createIndex({ index: { fields: ['name'] } }))
      .then(() => app.service('people-customid').Model.createIndex({ index: { fields: ['customid'] } }))
      .then(() => done())
      .catch(error => done(error));
  });

  describe('Initialization', () => {
    it('throws an error when missing options', () =>
      expect(service.bind(null)).to
      .throw('PouchDB datastore `Model` needs to be provided')
    );

    it('throws an error when missing a Model', () =>
      expect(service.bind(null, {})).to
      .throw('PouchDB datastore `Model` needs to be provided')
    );
  });

  describe('Common functionality', () => {
    it('is CommonJS compatible', () =>
      assert.ok(typeof require('../lib') === 'function')
    );

    base(app, errors, 'people', '_id');
    base(app, errors, 'people-customid', 'customid');
  });
});
