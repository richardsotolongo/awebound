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
 * Read access to the catalog. Implemented by the Supabase adapter (Postgres search) and the
 * in-memory seed adapter; a commerce provider sync writes into the same tables later.
 */
export interface ProductRepository {
  search(query: ProductQuery): Promise<ProductSearchResult>;
  facets(query: ProductQuery): Promise<CatalogFacets>;
  findBySlug(slug: string): Promise<ProductDetail | null>;
  findVariantsBySkus(skus: string[]): Promise<Map<string, VariantWithProduct>>;
  listCollections(): Promise<Collection[]>;
}
