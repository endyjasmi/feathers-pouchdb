export function convertQuery(feathersQuery) {
  const mangoQuery = {};
  for (let queryField in feathersQuery) {
    switch (queryField) {
      case '$select':
        mangoQuery.fields = feathersQuery[queryField];
        break;

      case '$sort':
        mangoQuery.sort = this._convertSort(feathersQuery[queryField]);
        break;

      case '$skip':
        mangoQuery.skip = feathersQuery[queryField];
        break;

      case '$limit':
        mangoQuery.limit = feathersQuery[queryField];
        break;

      default:
        mangoQuery.selector = mangoQuery.selector || {};
        mangoQuery.selector[queryField] = feathersQuery[queryField];
        break;
    }
  }
  return mangoQuery;
}

export function convertSort(feathersSort) {
  const mangoSort = [];
  for (let sortField in feathersSort) {
    if (feathersSort[sortField] < 0) {
      mangoSort.push({ [sortField]: 'desc' });
      continue;
    }
    if (feathersSort[sortField] > 0) {
      mangoSort.push({ [sortField]: 'asc'});
      continue;
    }
  }
  return mangoSort;
}

export function createMultiple(data) {
  return this.Model.bulkDocs(data)
    .then(responses => {
      return responses.map((response, index) => {
        return Object.assign(data[index], {
          _id: response.id,
          _rev: response.rev
        });
      });
    });
};

export function createSingle(data) {
  return this.Model.post(data)
    .then(response => {
      return Object.assign(data, {
        _id: response.id,
        _rev: response.rev
      });
    });
}
