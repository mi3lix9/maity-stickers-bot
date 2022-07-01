import { config } from "https://deno.land/x/dotenv/mod.ts";

export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || config().BOT_TOKEN;
export const DENO_ENV = (Deno.env.get("DENO_ENV") || config().DENO_ENV) as
  | "DEVELOPMENT"
  | "PRODUCTION";
