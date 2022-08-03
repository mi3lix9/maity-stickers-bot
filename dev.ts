import "https://deno.land/x/dotenv/load.ts";
import { initBot } from "./src/bot.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (typeof BOT_TOKEN === "undefined") {
  throw new Error("BOT_TOKEN is not defined");
}

const bot = initBot(BOT_TOKEN);

console.log("Bot is started using Long Poll.");
bot.start();
