import { config } from "https://deno.land/x/dotenv/mod.ts";

export const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || config().BOT_TOKEN;
