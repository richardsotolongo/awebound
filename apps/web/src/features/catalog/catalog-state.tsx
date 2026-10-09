"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";

type Change = Record<string, string | string[] | number | null | undefined>;

interface CatalogState {
  isPending: boolean;
  get: (key: string) => string | undefined;
  getList: (key: string) => string[];
  update: (changes: Change) => void;
  toggle: (key: string, value: string) => void;
  clear: () => void;
}

const Ctx = createContext<CatalogState | null>(null);

/**
 * Shop state lives in the URL, so every filtered view is shareable and Back works.
 * Updates replace the URL inside a transition; the server re-renders the listing.
 */
export function CatalogStateProvider({
  children,
  lockedKeys = [],
}: {
  children: ReactNode;
  lockedKeys?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Controls reflect a change immediately; the URL (and the server-rendered results) follow.
  const [optimistic, setOptimistic] = useOptimistic(params.toString());
  const current = useMemo(() => new URLSearchParams(optimistic), [optimistic]);

  const navigate = useCallback(
    (next: URLSearchParams) => {
      for (const key of lockedKeys) next.delete(key);
      const qs = next.toString();
      startTransition(() => {
        setOptimistic(qs);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [lockedKeys, pathname, router, setOptimistic],
  );

  const value = useMemo<CatalogState>(() => {
    const getList = (key: string) => current.get(key)?.split(",").filter(Boolean) ?? [];
    const update = (changes: Change) => {
      const next = new URLSearchParams(current.toString());
      for (const [key, v] of Object.entries(changes)) {
        const empty =
          v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
        if (empty) next.delete(key);
        else next.set(key, Array.isArray(v) ? v.join(",") : String(v));
      }
      navigate(next);
    };
    return {
      isPending,
      get: (key) => current.get(key) ?? undefined,
      getList,
      update,
      toggle: (key, value) => {
        const list = getList(key);
        update({
          [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
        });
      },
      clear: () => {
        const next = new URLSearchParams();
        const sort = current.get("sort");
        if (sort) next.set("sort", sort);
        navigate(next);
      },
    };
  }, [current, isPending, navigate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogState(): CatalogState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogState must be used inside CatalogStateProvider");
  return ctx;
}
