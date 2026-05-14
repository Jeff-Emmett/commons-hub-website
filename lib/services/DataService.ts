import * as actions from "./DataServiceActions";

/**
 * Thin client-callable facade over the DataServiceActions server actions.
 * Preserves the historic `dataService.foo(...)` shape that the admin UI
 * already wires through; the methods themselves run on the server and use
 * the logged-in user's Directus token.
 */
export class DataService {
  getAll = actions.getAll;
  getById = actions.getById;
  create = actions.create;
  update = actions.update;
  delete = actions.deleteOne;
  search = actions.search;
  getManyToManyRelationships = actions.getManyToManyRelationships;
  deleteByQuery = actions.deleteByQuery;
  getRelatedItems = actions.getRelatedItems;
  count = actions.count;
}

export const dataService = new DataService();
