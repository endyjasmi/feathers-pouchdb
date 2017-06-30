// import errors from 'feathers-errors';
import makeDebug from 'debug';

const debug = makeDebug('feathers-pouchdb');

export default function init () {
  debug('Initializing feathers-pouchdb plugin');
  return 'feathers-pouchdb';
}
