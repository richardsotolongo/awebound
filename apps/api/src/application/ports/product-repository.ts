import type {
  CatalogFacets,
  Collection,
  ProductDetail,
  ProductQuery,
  ProductSummary,
  VariantWithProduct,
} from "../../domain/catalog";

export interface ProductSearchResult {
  items: ProductSummary[];
  total: number;
}

/**
 * Read access to the catalog. Implemented by the Fourthwall adapter (live shop merged with the
 * brand content), which searches with the in-memory engine.
 */
export interface ProductRepository {
  search(query: ProductQuery): Promise<ProductSearchResult>;
  facets(query: ProductQuery): Promise<CatalogFacets>;
  findBySlug(slug: string): Promise<ProductDetail | null>;
  findVariantsBySkus(skus: string[]): Promise<Map<string, VariantWithProduct>>;
  listCollections(): Promise<Collection[]>;
}
