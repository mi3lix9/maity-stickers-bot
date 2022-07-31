import "https://deno.land/x/dotenv/load.ts";
import { bot } from "./src/bot.ts";

Deno.env.set("DENO_ENV", "DEVELOPMENT");

console.log("Bot is started using Long Poll.");
await bot.start();
