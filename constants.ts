import { config } from "https://deno.land/x/dotenv/mod.ts";

export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || config().BOT_TOKEN;
export const BOT_OWNER_ID = Deno.env.get("BOT_OWNER_ID") || config().BOT_OWNER;
