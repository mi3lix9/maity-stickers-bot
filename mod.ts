import { BotError, webhookCallback } from "grammy";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { freeStorage } from "@grammyjs/freestorage";
import { initBot, MyContext } from "./src/bot.ts";
import { SessionData } from "./src/session.ts";

const token = Deno.env.get("BOT_TOKEN");

if (typeof token === "undefined") {
  throw new Error("BOT_TOKEN is not defined");
}

const storage = freeStorage<SessionData>(token);
const bot = initBot(token, storage);

const app = new Application();
const router = new Router();

router.post("/" + token, webhookCallback(bot, "oak"));
router.use(() => new Response("Hello world!"));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof BotError<MyContext>) { 
      const ctx = error.ctx as MyContext
      console.error({
        message: ctx.message,
        conversation: await ctx.conversation.active(),
        error: error.error
      });
      delete (ctx.session as any).conversation
      await ctx.conversation.exit();
      return await ctx.reply(error.message) 
      
    }
    console.error(error);
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
