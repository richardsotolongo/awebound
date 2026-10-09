import type { SeedCatalog } from "@awebound/shared/seed";
import type { Logger, ProductRepository, ProductSearchResult } from "../../application/ports";
import type {
  CatalogFacets,
  Collection,
  ProductDetail,
  ProductQuery,
  VariantWithProduct,
} from "../../domain/catalog";
import { UnavailableError } from "../../domain/errors";
import { InMemoryProductRepository } from "../catalog/in-memory-catalog";
import { mergeFourthwallCatalog } from "./merge-catalog";
import type { FourthwallStorefront } from "./storefront-client";

/**
 * Catalog backed by the live Fourthwall shop, merged with the site's brand content and cached
 * for a short time. Search, filters and facets reuse the in-memory engine over the merged set.
 * If Fourthwall is briefly unreachable, the last good copy keeps serving.
 */
export class FourthwallProductRepository implements ProductRepository {
  private cached?: { at: number; repo: InMemoryProductRepository };
  private loading?: Promise<InMemoryProductRepository>;

  constructor(
    private readonly storefront: FourthwallStorefront,
    private readonly content: SeedCatalog,
    private readonly logger: Logger,
    private readonly ttlMs = 60_000,
  ) {}

  private async load(): Promise<InMemoryProductRepository> {
    const products = await this.storefront.listProducts();
    const merged = mergeFourthwallCatalog(this.content, products);
    if (merged.unmatched.length || merged.missing.length) {
      this.logger.warn(
        { notOnSite: merged.unmatched, notInFourthwall: merged.missing },
        "fourthwall catalog: products without a match are hidden",
      );
    }
    return new InMemoryProductRepository(merged.catalog, merged.providerIds);
  }

  private async repo(): Promise<InMemoryProductRepository> {
    if (this.cached && Date.now() - this.cached.at < this.ttlMs) return this.cached.repo;
    this.loading ??= this.load()
      .then((repo) => {
        this.cached = { at: Date.now(), repo };
        return repo;
      })
      .finally(() => {
        this.loading = undefined;
      });
    try {
      return await this.loading;
    } catch (err) {
      if (this.cached) {
        this.logger.warn({ err }, "fourthwall unreachable; serving the last catalog");
        return this.cached.repo;
      }
      throw Object.assign(
        new UnavailableError("The shop is unreachable right now. Try again in a moment."),
        {
          cause: err,
        },
      );
    }
  }

  async search(query: ProductQuery): Promise<ProductSearchResult> {
    return (await this.repo()).search(query);
  }

  async facets(query: ProductQuery): Promise<CatalogFacets> {
    return (await this.repo()).facets(query);
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return (await this.repo()).findBySlug(slug);
  }

  async findVariantsBySkus(skus: string[]): Promise<Map<string, VariantWithProduct>> {
    return (await this.repo()).findVariantsBySkus(skus);
  }

  async listCollections(): Promise<Collection[]> {
    return this.content.collections;
  }
}
