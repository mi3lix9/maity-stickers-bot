import { webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
// You might modify this to the correct way to import your `Bot` object.
import { configAsync } from "https://deno.land/x/dotenv/mod.ts";

import { bot } from "./bot.ts";

const handleUpdate = webhookCallback(bot, "std/http");

serve({
  ["/" + (await configAsync()).BOT_TOKEN]: async (req) => {
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
