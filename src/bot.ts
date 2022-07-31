import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { freeStorage } from "@grammyjs/freestorage";
import { BOT_TOKEN } from "../constants.ts";

import { addSticker } from "./conversations/addSticker.ts";
import { createNewPack } from "./conversations/createNewPack.ts";
import { MyContext, SessionData } from "./types.ts";

if (typeof BOT_TOKEN === "undefined") {
  throw new Error("BOT_TOKEN is not defined");
}

export const bot = new Bot<MyContext>(BOT_TOKEN);

const storage =
  Deno.env.get("DENO_ENV") === "DEVELOPMENT"
    ? undefined
    : freeStorage<SessionData>(bot.token);

bot.use(
  session({
    initial: () => ({
      sets: [],
      fastMode: false,
    }),
    storage,
  })
);

bot.command("cancel", (ctx) => {
  delete ctx.session.conversation;
});

bot.use(conversations());

bot.command("cancel", (ctx) => {
  ctx.conversation.exit();
  return ctx.reply("Canceled.");
});

bot.command("start", async (ctx) => {
  return await ctx.reply(
    "Hello! I am a bot that helps you create sticker packs easily, please enter /newpack to start new pack or /addSticker to add sticker to your existing pack \n\n Please notice that, this sticker is still under development, so you might get unexpected results. Please report any bugs to Ali @mi3lix9! "
  );
});

bot.use(createConversation(createNewPack));
bot.use(createConversation(addSticker));

bot.command(
  "newpack",
  async (ctx) => await ctx.conversation.enter("createNewPack")
);
bot.command(
  "addsticker",
  async (ctx) => await ctx.conversation.enter("addSticker")
);
bot.command("delpack", async (ctx) => {
  await ctx.reply("You can delete your pack from the official @stickers bot ");
});

bot.catch(async (error) => {
  await error.ctx.reply(error.message);
  console.log(error.message);
});
