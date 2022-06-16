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
import { download } from "https://deno.land/x/download/mod.ts";

import {
  FileFlavor,
  hydrateFiles,
} from "https://deno.land/x/grammy_files@v1.0.4/mod.ts";
import { resize } from "https://deno.land/x/deno_image/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

interface SessionData {
  sets: string[];
}

type MyContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ConversationFlavor;

type MyConversation = Conversation<MyContext>;

async function createStickerPack(conversation: MyConversation, ctx: MyContext) {
  let name: string;
  let title: string;
  let stickerPath: string;
  let emoji: string;
  await ctx.reply("Send a title for your pack");
  ctx = await conversation.waitFor(":text");
  title = ctx.message?.text!;

  await ctx.reply("Send a name for your pack");
  ctx = await conversation.waitFor(":text");
  name = ctx.message?.text!;

  while (name.includes(" ")) {
    await ctx.reply("Name cannot contain spaces");
    await ctx.reply("Send a name for your pack");
    ctx = await conversation.waitFor(":text");
    name = ctx.message?.text!;
  }

  // const isSticker = !!(await bot.api.getStickerSet(name));

  // while (!isSticker) {
  //   await ctx.reply("Name is already taken");
  //   await ctx.reply("Send a name for your pack");
  //   ctx = await conversation.waitFor(":text");
  //   name = ctx.message?.text!;
  // }

  const getBot = await bot.api.getMe();
  name += "_by_" + getBot.username;

  await ctx.reply("Send a sticker");
  ctx = await conversation.waitFor([":sticker", ":photo"]);

  const { width, height } = ctx.message?.photo?.[0]! || ctx.message?.sticker!;
  const aspectRatio = width / height;
  const newWidth = width >= height ? 512 : 512 / aspectRatio;
  const newHeight = height >= width ? 512 : 512 / aspectRatio;

  const file = await ctx.getFile();

  // stickerPath = await conversation.external(() =>
  //   file?.download("./tmp/" + file.file_id)
  // );
  // stickerPath = sticker?.getUrl();

  await ctx.reply("Send emojis for this sticker");
  ctx = await conversation.waitFor(":text");
  emoji = ctx.message?.text!;

  const newSticker = await resize(Deno.readFileSync(file.getUrl()), {
    width: newWidth,
    height: newHeight,
  });

  const t = await ctx.api.createNewStickerSet(
    ctx.from!.id,
    name!,
    title!,
    emoji!,
    { png_sticker: new InputFile(newSticker) }
  );

  await ctx.reply(`Sticker pack created!: \n https://t.me/addstickers/${name}`);
  // await Deno.remove(".tmp/" + file.file_id);
}

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") || config().BOT_TOKEN;

export const bot = new Bot<MyContext>(BOT_TOKEN);

bot.api.config.use(hydrateFiles(bot.token));
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(createStickerPack));

bot.command("newpack", (ctx) => ctx.conversation.enter("createStickerPack"));

bot.command("start", (ctx) =>
  ctx.reply("This bot is not ready yet, please wait ❤️")
);

bot.command("fevoratefood", (ctx) => ctx.conversation.enter("fevorateFood"));

bot.on([":sticker", ":photo"], async (ctx) => {
  const { width, height } = ctx.message?.photo?.[0]! || ctx.message?.sticker!;
  const aspectRatio = width / height;
  const newWidth = width >= height ? 512 : 512 / aspectRatio;
  const newHeight = height >= width ? 512 : 512 / aspectRatio;
  const file = await ctx.getFile();

  // const res = await fetch(file.getUrl());
  const tz = await download(file.getUrl());
  console.log(tz);

  // const newSticker = await resize(body, {
  //   width: newWidth,
  //   height: newHeight,
  // });

  // await ctx.replyWithPhoto(new InputFile(newSticker));
});

bot.catch((error) => {
  error.ctx.reply("Something went wrong");
  console.error(error);
});
bot.start();
