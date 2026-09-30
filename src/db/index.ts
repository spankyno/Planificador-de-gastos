import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as schema from "./schema";

export const getDb = () => drizzle(getRequestContext().env.DB as D1Database, { schema });
