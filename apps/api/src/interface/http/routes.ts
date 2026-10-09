import { Router } from "express";
import {
  BagValidateRequestSchema,
  CheckoutRequestSchema,
  ContactRequestSchema,
  ProductQuerySchema,
  SubscribeRequestSchema,
  UpdateProfileRequestSchema,
  type Ok,
} from "@awebound/shared";
import type { Container } from "../../container";
import { currentUser, limiter, optionalUser, publicCache, requireUser } from "./middleware";
import { parseBody, parseQuery } from "./validation";

const ok: Ok = { ok: true };

/** Version 1 of the HTTP API. Thin controllers: validate with the shared schema, call a use case, return JSON. */
export function v1Routes({ useCases, tokens }: Container): Router {
  const r = Router();
  const auth = requireUser(tokens);
  const maybeAuth = optionalUser(tokens);

  // Catalog
  r.get("/products", publicCache(60), async (req, res) => {
    res.json(await useCases.searchProducts.execute(parseQuery(ProductQuerySchema, req)));
  });
  r.get("/products/facets", publicCache(60), async (req, res) => {
    res.json(await useCases.getCatalogFacets.execute(parseQuery(ProductQuerySchema, req)));
  });
  r.get("/products/:slug", publicCache(60), async (req, res) => {
    res.json(await useCases.getProductBySlug.execute(String(req.params.slug)));
  });
  r.get("/collections", publicCache(300), async (_req, res) => {
    res.json(await useCases.listCollections.execute());
  });

  // Bag and checkout (guest checkout; a signed-in user is linked when present)
  r.post("/bag/validate", limiter(1, 60), async (req, res) => {
    const { lines } = parseBody(BagValidateRequestSchema, req);
    res.json(await useCases.validateBag.execute(lines));
  });
  r.post("/checkout", limiter(10, 30), maybeAuth, async (req, res) => {
    const body = parseBody(CheckoutRequestSchema, req);
    res.json(await useCases.startCheckout.execute(body, currentUser(res)?.id));
  });

  // Messages
  r.post("/contact", limiter(10, 5), maybeAuth, async (req, res) => {
    const body = parseBody(ContactRequestSchema, req);
    if (body.website) {
      // Honeypot filled in: pretend success, send nothing.
      res.json(ok);
      return;
    }
    await useCases.submitContactMessage.execute(body, currentUser(res)?.id);
    res.json(ok);
  });
  r.post("/subscribers", limiter(10, 10), async (req, res) => {
    await useCases.subscribeToDropNotes.execute(parseBody(SubscribeRequestSchema, req));
    res.json(ok);
  });

  // Account
  r.get("/me", auth, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await useCases.getProfile.execute(currentUser(res)!));
  });
  r.patch("/me", auth, async (req, res) => {
    const { fullName } = parseBody(UpdateProfileRequestSchema, req);
    res.setHeader("Cache-Control", "no-store");
    res.json(await useCases.updateProfile.execute(currentUser(res)!, fullName));
  });

  return r;
}
