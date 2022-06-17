import {
  Bot,
  Context,
  InputFile,
  session,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v0.6.2/mod.ts";

import {
  FileFlavor,
  hydrateFiles,
} from "https://deno.land/x/grammy_files@v1.0.4/mod.ts";
import { BOT_OWNER_ID, BOT_TOKEN } from "./constants.ts";
import { resizeImage } from "./resizeImage.ts";

interface SessionData {
  // sets: string[];
}

type MyContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ConversationFlavor;

type MyConversation = Conversation<MyContext>;

async function createStickerPack(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Send a title for your pack");
  ctx = await conversation.waitFor(":text");
  const title = ctx.message?.text!;

  let name: string;
  let isAvailable: boolean;
  do {
    await ctx.reply("Send a name for your pack");
    ctx = await conversation.waitFor(":text");
    name = ctx.message?.text!;
    isAvailable = !!(await bot.api.getStickerSet(name));
  } while (name.includes(" ") && !isAvailable);

  const getBot = await bot.api.getMe();
  name += "_by_" + getBot.username;

  const { emojis, sticker } = await getSticker(ctx, conversation);

  await ctx.api.createNewStickerSet(ctx.from!.id, name!, title!, emojis!, {
    png_sticker: sticker!,
  });

  await ctx.reply(
    `Sticker pack created!: \n https://t.me/addstickers/${name} \n\n you can send more stickers, or send /done to stop`
  );

  ctx = await conversation.waitFor(":text");
  if (ctx.message?.text == "/done") {
    return await ctx.reply("Sticker pack created!");
  }

  await ctx.conversation.enter("addSticker");
}

async function addSticker(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Send a sticker from your pack that you want to add");
  ctx = await conversation.waitFor(":sticker");
  const name = ctx.message?.text!;

  do {
    await ctx.reply("Now, send a sticker or a photo to add into your pack");
    ctx = await conversation.waitFor([":sticker", ":photo"]);

    const { sticker, emojis } = await getSticker(ctx, conversation);
    await ctx.api.addStickerToSet(ctx.from!.id, name, emojis, {
      png_sticker: sticker,
    });
    await ctx.reply("Sticker added!, send another sticker or /done to stop");
  } while (ctx.message?.text != "/done");
}

export const bot = new Bot<MyContext>(BOT_TOKEN);

bot.api.config.use(hydrateFiles(bot.token));
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(createStickerPack));
bot.use(createConversation(addSticker));

bot.command("newpack", (ctx) => ctx.conversation.enter("createStickerPack"));
bot.command("addsticker", (ctx) => ctx.conversation.enter("addSticker"));

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

bot.catch(async (error) => {
  await error.ctx.reply("Something went wrong 🤐");
  error.ctx.api.sendMessage(BOT_OWNER_ID, JSON.stringify({ error }, null, 2));
  console.error(error);
});

// bot.start();

async function getSticker(ctx: MyContext, conversation: MyConversation) {
  let sticker: string | InputFile;
  let emojis = "";

  await ctx.reply("Send a sticker");
  ctx = await conversation.waitFor([":sticker", ":photo"]);
  if (ctx.message?.sticker) {
    sticker = ctx.message?.sticker.file_id;
  } else if (ctx.message?.photo) {
    const { width, height } = ctx.message?.photo?.[0]!;
    const file = await ctx.getFile();
    sticker = await resizeImage(file.getUrl(), width, height);
  }

  await ctx.reply("Send emojis for this sticker");
  ctx = await conversation.waitFor(":text");
  emojis = ctx.message?.text!;

  return { sticker: sticker!, emojis };
}
