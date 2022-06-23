import { Bot, session } from "https://deno.land/x/grammy/mod.ts";
import {
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations/mod.ts";
import { hydrateFiles } from "https://deno.land/x/grammy_files/mod.ts";
import { addStickerConversation } from "./conversations/addSticker.ts";
import { createStickerSetConversation } from "./conversations/createNewStickerPack.ts";

import { BOT_TOKEN } from "./constants.ts";
import { MyContext, SessionData } from "./types.ts";

const initialSession = (): SessionData => ({
  sets: new Set(),
  fastMode: false,
});

export const bot = new Bot<MyContext>(BOT_TOKEN);

bot.api.config.use(hydrateFiles(bot.token));
bot.use(session({ initial: initialSession }));
bot.use(conversations());
bot.use(createConversation(createStickerSetConversation));
bot.use(createConversation(addStickerConversation));

bot.command("newpack", (ctx) =>
  ctx.conversation.enter("createStickerSetConversation")
);
bot.command("addsticker", (ctx) =>
  ctx.conversation.enter("addStickerConversation")
);
bot.command("cancel", (ctx) => {
  if (ctx.conversation.active) {
    ctx.conversation.exit();
    ctx.reply("cancelled");
  }
});

bot.command("start", (ctx) =>
  ctx.reply(
    "Hello! I am a bot that helps you create sticker packs easily, please enter /newpack to start new pack or /addSticker to add sticker to your existing pack \n\n Please notice that, this sticker is still under development, so you might get unexpected results. Please report any bugs to @mi3lix9!"
  )
);

bot.api.setMyCommands([
  { command: "newpack", description: "Create a new sticker pack" },
  { command: "addsticker", description: "Add sticker to your existing pack" },
]);
// bot.command("myid", (ctx) => ctx.reply(ctx.from!.id.toString()));

// bot.start();
