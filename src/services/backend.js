import { ConvexClient } from 'convex/browser';
import { anyApi } from 'convex/server';

const url = import.meta.env.VITE_CONVEX_URL;
const client = url ? new ConvexClient(url) : null;
let online = Boolean(client);

export const api = anyApi;

export const hasBackend = () => online;

const isMissingFunction = (error) => /could not find (public )?function/i.test(error?.message ?? '');

/**
 * Runs a Convex query, mutation or action. Until the deployment has our functions (or when no
 * deployment is configured) it runs `local` instead, so the app keeps working on browser storage.
 */
export async function call(kind, fn, args, local) {
  if (online) {
    try {
      return await client[kind](fn, args);
    } catch (error) {
      if (!isMissingFunction(error)) throw error;
      online = false;
      console.warn('Convex functions are not deployed yet; using browser storage. Run `npx convex dev`.');
    }
  }
  return local();
}
