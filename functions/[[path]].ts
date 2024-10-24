import type { ServerBuild } from "@remix-run/cloudflare";
import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { getLoadContext } from "../load-context";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the server build file is generated by `remix vite:build`
// eslint-disable-next-line import/no-unresolved
import * as rawBuild from "../build/server";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - the server build is a js file and as such it doesn't include all the appropriate types
const build = rawBuild as ServerBuild;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const onRequest = createPagesFunctionHandler({ build, getLoadContext });