import { webhookCallback } from "https://deno.land/x/grammy@v1.9.2/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { bot } from "./src/bot.ts";

const token = Deno.env.get("BOT_TOKEN");

const app = new Application();
const router = new Router();

router.post("/" + token, webhookCallback(bot, "oak"));
router.use(() => new Response("Hello world!"));

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("error", (e) => {
  console.error("ERROR: ", e.error);
});

app.addEventListener("listen", (e) => {
  console.log("Bot is started using Webhooks at: ", e.hostname);
});

await app.listen({ hostname: "localhost", port: 8080 });
