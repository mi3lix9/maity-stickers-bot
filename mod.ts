import { webhookCallback } from "https://deno.land/x/grammy@v1.9.2/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { freeStorage } from "@grammyjs/freestorage";
import { initBot } from "./src/bot.ts";
import { SessionData } from "./src/session.ts";

const token = Deno.env.get("BOT_TOKEN");

if (typeof token === "undefined") {
  throw new Error("BOT_TOKEN is not defined");
}

const storage = freeStorage<SessionData>(token);
// const bot = initBot(token, storage);
const bot = initBot(token);

const app = new Application();
const router = new Router();

router.post("/" + token, webhookCallback(bot, "oak"));
router.use(() => new Response("Hello world!"));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    console.log(e);
    ctx.response.status = 500;
    ctx.response.body = "Internal server error";
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", (e) => {
  console.log("Bot is started using Webhooks at: ", e.hostname);
});

await app.listen({ hostname: "localhost", port: 8080 });
