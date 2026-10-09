import { seedCatalog } from "@awebound/shared/seed";
import {
  GetCatalogFacets,
  GetProductBySlug,
  GetProfile,
  ListCollections,
  SearchProducts,
  StartCheckout,
  SubmitContactMessage,
  SubscribeToDropNotes,
  UpdateProfile,
  ValidateBag,
  type CheckoutGateway,
  type ContactRepository,
  type ProductRepository,
  type ProfileRepository,
  type SubscriberRepository,
  type TokenVerifier,
} from "./application";
import {
  DisabledTokenVerifier,
  SupabaseTokenVerifier,
} from "./infrastructure/accounts/supabase-token-verifier";
import { SupabaseProfileRepository } from "./infrastructure/accounts/supabase-profile-repository";
import { InMemoryProductRepository } from "./infrastructure/catalog/in-memory-catalog";
import { SupabaseProductRepository } from "./infrastructure/catalog/supabase-product-repository";
import { FourthwallCheckoutGateway } from "./infrastructure/commerce/fourthwall-checkout-gateway";
import { UnconfiguredCheckoutGateway } from "./infrastructure/commerce/unconfigured-checkout-gateway";
import { FourthwallProductRepository } from "./infrastructure/fourthwall/fourthwall-product-repository";
import { FourthwallStorefront } from "./infrastructure/fourthwall/storefront-client";
import type { Env } from "./infrastructure/config/env";
import { ConsoleMailer, ResendMailer } from "./infrastructure/email/mailers";
import {
  InMemoryContactRepository,
  InMemorySubscriberRepository,
} from "./infrastructure/inbox/in-memory-inbox";
import {
  SupabaseContactRepository,
  SupabaseSubscriberRepository,
} from "./infrastructure/inbox/supabase-inbox";
import type { AppLogger } from "./infrastructure/logger";
import { createSupabaseAdmin } from "./infrastructure/supabase/client";
import { UnavailableError } from "./domain/errors";
import type { Profile } from "@awebound/shared";

/** Profiles need Supabase; without it the account endpoints answer 503. */
class UnavailableProfiles implements ProfileRepository {
  private fail(): never {
    throw new UnavailableError("Accounts aren’t set up yet.");
  }
  async findById(): Promise<Profile | null> {
    return this.fail();
  }
  async upsert(): Promise<Profile> {
    return this.fail();
  }
  async updateName(): Promise<Profile> {
    return this.fail();
  }
}

function createCheckoutGateway(
  env: Env,
  logger: AppLogger,
  fourthwall: FourthwallStorefront | null,
): CheckoutGateway {
  if (env.COMMERCE_PROVIDER === "fourthwall" && fourthwall && env.FOURTHWALL_CHECKOUT_DOMAIN) {
    return new FourthwallCheckoutGateway(
      fourthwall,
      env.FOURTHWALL_CHECKOUT_DOMAIN,
      env.FOURTHWALL_CURRENCY,
      logger,
    );
  }
  if (env.COMMERCE_PROVIDER !== "none") {
    // Adapters for Printful, Printify and Apliiq are not written yet (docs/TODOS.md).
    logger.warn(
      { provider: env.COMMERCE_PROVIDER },
      "commerce provider set but no adapter exists yet; checkout stays closed",
    );
  }
  return new UnconfiguredCheckoutGateway();
}

/**
 * Composition root: the only place that knows which adapter implements which port.
 * Everything else depends on the interfaces in src/application/ports.
 */
export function buildContainer(env: Env, logger: AppLogger) {
  const supabase =
    env.SUPABASE_URL && env.SUPABASE_SECRET_KEY
      ? createSupabaseAdmin(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
      : null;

  const fourthwall = env.FOURTHWALL_STOREFRONT_TOKEN
    ? new FourthwallStorefront({
        apiUrl: env.FOURTHWALL_API_URL,
        storefrontToken: env.FOURTHWALL_STOREFRONT_TOKEN,
        currency: env.FOURTHWALL_CURRENCY,
      })
    : null;

  // Fourthwall: live variants, prices, stock and photos merged with the brand content in
  // packages/shared/src/seed/catalog.json. Supabase: everything from Postgres. Seed: offline.
  const products: ProductRepository =
    env.CATALOG_SOURCE === "fourthwall" && fourthwall
      ? new FourthwallProductRepository(fourthwall, seedCatalog, logger)
      : env.CATALOG_SOURCE === "supabase" && supabase
        ? new SupabaseProductRepository(supabase)
        : new InMemoryProductRepository(seedCatalog);

  const contacts: ContactRepository = supabase
    ? new SupabaseContactRepository(supabase)
    : new InMemoryContactRepository(logger);
  const subscribers: SubscriberRepository = supabase
    ? new SupabaseSubscriberRepository(supabase)
    : new InMemorySubscriberRepository(logger);
  const profiles: ProfileRepository = supabase
    ? new SupabaseProfileRepository(supabase)
    : new UnavailableProfiles();

  const tokens: TokenVerifier = env.SUPABASE_URL
    ? new SupabaseTokenVerifier(env.SUPABASE_URL, env.SUPABASE_JWT_SECRET)
    : new DisabledTokenVerifier();

  const mailConfig = {
    from: env.EMAIL_FROM,
    inbox: env.CONTACT_INBOX,
    siteUrl: env.PUBLIC_SITE_URL.replace(/\/$/, ""),
  };
  const mailer = env.RESEND_API_KEY
    ? new ResendMailer(env.RESEND_API_KEY, mailConfig)
    : new ConsoleMailer(mailConfig, logger);

  const checkout = createCheckoutGateway(env, logger, fourthwall);
  const validateBag = new ValidateBag(products);

  logger.info(
    {
      catalog: products.constructor.name,
      inbox: contacts.constructor.name,
      mailer: mailer.constructor.name,
      checkout: checkout.provider,
      accounts: Boolean(supabase),
    },
    "adapters wired",
  );

  return {
    tokens,
    useCases: {
      searchProducts: new SearchProducts(products),
      getCatalogFacets: new GetCatalogFacets(products),
      getProductBySlug: new GetProductBySlug(products),
      listCollections: new ListCollections(products),
      validateBag,
      startCheckout: new StartCheckout(products, checkout, logger),
      submitContactMessage: new SubmitContactMessage(contacts, mailer, logger),
      subscribeToDropNotes: new SubscribeToDropNotes(subscribers, mailer, logger),
      getProfile: new GetProfile(profiles),
      updateProfile: new UpdateProfile(profiles),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
export type UseCases = Container["useCases"];
