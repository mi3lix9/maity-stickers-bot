import {
  Bot,
  session,
  Composer,
  StorageAdapter,
  Context,
  SessionFlavor,
} from "grammy";
import {
  Conversation,
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { autoRetry } from "https://esm.sh/@grammyjs/auto-retry";

// Use the plugin.

import { addSticker } from "./conversations/addSticker.ts";
import { createStickerPack } from "./conversations/createNewPack.ts";
import { createInitialSessionData, SessionData } from "./session.ts";

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor;

export type MyConversation = Conversation<MyContext>;

export function initBot(token: string, storage?: StorageAdapter<SessionData>) {
  const _bot = new Bot<MyContext>(token);
  // _bot.api.config.use(autoRetry({ retryOnInternalServerErrors: false }));

  _bot.use(
    session({
      initial: createInitialSessionData,
      storage,
    })
  );

  // _bot.use(conversations());
  _bot.use(bot);

  _bot.catch(async (error) => {
    await error.ctx.reply(error.message);
    console.log(error.message);
  });

  return _bot;
}

const bot = new Composer<MyContext>();

bot.hears("__reset", (ctx) => {
  ctx.reply((ctx.session as any).conversation);
  delete (ctx.session as any).conversation;
});

bot.command("cancel", async (ctx) => {
  await ctx.conversation.exit();
  return ctx.reply("Canceled.");
});

bot.command("start", async (ctx) => {
  return await ctx.reply(
    "Hello! I am a bot that helps you create sticker packs easily, please enter /newpack to start new pack or /addSticker to add sticker to your existing pack \n\n Please notice that, this sticker is still under development, so you might get unexpected results. Please report any bugs to Ali @mi3lix9!"
  );
});

// bot.use(createConversation(createStickerPack));
// bot.use(createConversation(addSticker));

bot.command(
  "newpack",
  async (ctx) => await ctx.conversation.enter("createStickerPack")
);
bot.command(
  "addsticker",
  async (ctx) => await ctx.conversation.enter("addSticker")
);
bot.command("delpack", async (ctx) => {
  await ctx.reply("You can delete your pack from the official @stickers bot ");
});
