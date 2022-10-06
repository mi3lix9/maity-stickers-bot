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
import { processSticker } from "./utils/imageProcessor.ts";
import { createInitialSessionData, SessionData } from "./session.ts";
// import { addSticker, createStickerPack } from "./StickerGenerator.ts";

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor;

export type MyConversation = Conversation<MyContext>;

export function initBot(token: string, storage?: StorageAdapter<SessionData>) {
  const _bot = new Bot<MyContext>(token);
  _bot.api.config.use(
    autoRetry({
      retryOnInternalServerErrors: false,
      maxDelaySeconds: 10,
      maxRetryAttempts: 3,
    })
  );

  _bot.use(
    session({
      initial: createInitialSessionData,
      storage,
    })
  );
  _bot.use(conversations());

  _bot.use(bot);
  _bot.catch(async (error) => {
    await error.ctx.reply(error.message);
    console.log(error.message);
  });

  return _bot;
}

const bot = new Composer<MyContext>();

bot.command("cancel", async (ctx) => {
  await ctx.conversation.exit();
  return ctx.reply("Canceled.");
});

bot.command("start", async (ctx) => {
  return await ctx.reply(
    "Hello! I am a bot that helps you create sticker packs easily, please enter /newpack to start new pack or /addSticker to add sticker to your existing pack \n\n Please notice that, this sticker is still under development, so you might get unexpected results. Please report any bugs to Ali @mi3lix9!"
  );
});

// bot.use(createConversation(createStickerPack("ANIMATED")));
// bot.use(createConversation(createStickerPack("PNG")));
// bot.use(createConversation(createStickerPack("VIDEO")));
// bot.use(createConversation(addSticker("ANIMATED")));
// bot.use(createConversation(addSticker("PNG")));
// bot.use(createConversation(addSticker("VIDEO")));

// bot.command(
//   "newpack",
//   async (ctx) => await ctx.conversation.enter("createStickerPack")
// );
// bot.command(
//   "addsticker",
//   async (ctx) => await ctx.conversation.enter("addSticker")
// );
// bot.command("delpack", async (ctx) => {
//   await ctx.reply("You can delete your pack from the official @stickers bot ");
// });

bot.on([":photo", ":sticker", ":file"], async (ctx) => {
  const sticker = await processSticker(ctx);

  if (sticker) {
    await ctx.replyWithDocument(sticker);
  }
});
