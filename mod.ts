import { webhookCallback } from "https://deno.land/x/grammy/mod.ts";
import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
// You might modify this to the correct way to import your `Bot` object.

import { BOT_TOKEN, DENO_ENV } from "./constants.ts";
import { bot } from "./bot.ts";

switch (DENO_ENV) {
  case "PRODUCTION":
    webhookApp();
    console.log("Bot is started using Webhooks.");
    break;
  case "DEVELOPMENT":
  default:
    console.log("Bot is started using Long Pool.");
    bot.catch(async (error) => {
      await error.ctx.reply(error.message);
      console.log(error.message);
    });
    await bot.start();
}

function webhookApp() {
  const handleUpdate = webhookCallback(bot, "std/http");

  serve({
    ["/" + BOT_TOKEN]: async (req) => {
      if (req.method == "POST") {
        try {
          return await handleUpdate(req);
        } catch (err) {
          console.error(err);
        }
      }
      return new Response();
    },
    "/": () => {
      return new Response("Hello world!");
    },
  });
}
