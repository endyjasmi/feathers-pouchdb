import _ from 'lodash';

export function computeLimit (limit, paginate) {
  const lower = !_.isUndefined(limit) ? parseInt(limit) : paginate.default;
  const upper = _.isNumber(paginate.max) ? paginate.max : Number.MAX_VALUE;
  return Math.min(lower, upper);
}

export function convertQuery (feathersQuery) {
  const mangoQuery = {
    selector: {}
  };
  for (let queryField in feathersQuery) {
    switch (queryField) {
      case '$select':
        mangoQuery.fields = feathersQuery[queryField];
        break;

      case '$index':
        mangoQuery.use_index = feathersQuery[queryField];
        break;

      case '$sort':
        mangoQuery.sort = convertSort(feathersQuery[queryField]);
        break;

      case '$skip':
        mangoQuery.skip = parseInt(feathersQuery[queryField]);
        break;

      case '$limit':
        mangoQuery.limit = parseInt(feathersQuery[queryField]);
        break;

      default:
        mangoQuery.selector[queryField] = feathersQuery[queryField];
        break;
    }
  }
  return mangoQuery;
}

export function convertSort (feathersSort) {
  const mangoSort = [];
  for (let sortField in feathersSort) {
    if (feathersSort[sortField] < 0) {
      mangoSort.push({ [sortField]: 'desc' });
      continue;
    }
    if (feathersSort[sortField] > 0) {
      mangoSort.push({ [sortField]: 'asc' });
      continue;
    }
  }
  return mangoSort;
}

export function extractMetadata (pouchdbResponse) {
  const metadata = _.pick(pouchdbResponse, ['id', 'rev']);
  return _.mapKeys(metadata, (value, key) => `_${key}`);
}
