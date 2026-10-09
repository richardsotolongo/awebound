import type {
  CatalogFacets,
  Collection,
  ProductDetail,
  ProductList,
  ProductQuery,
} from "../../domain/catalog";
import { NotFoundError } from "../../domain/errors";
import type { ProductRepository } from "../ports";

/** Shop listing: search, filters, sort and paging. */
export class SearchProducts {
  constructor(private readonly products: ProductRepository) {}

  async execute(query: ProductQuery): Promise<ProductList> {
    const { items, total } = await this.products.search(query);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    };
  }
}

/** Filter options with counts for the current query. */
export class GetCatalogFacets {
  constructor(private readonly products: ProductRepository) {}

  execute(query: ProductQuery): Promise<CatalogFacets> {
    return this.products.facets(query);
  }
}

export class GetProductBySlug {
  constructor(private readonly products: ProductRepository) {}

  async execute(slug: string): Promise<ProductDetail> {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new NotFoundError("That piece isn’t in the shop.");
    return product;
  }
}

export class ListCollections {
  constructor(private readonly products: ProductRepository) {}

  execute(): Promise<Collection[]> {
    return this.products.listCollections();
  }
}
