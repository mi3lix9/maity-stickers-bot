import { InlineKeyboard } from "https://deno.land/x/grammy/mod.ts";
import {
  InputFile,
  Message,
} from "https://deno.land/x/grammy/platform.deno.ts";
import { bot } from "../bot.ts";
import type { MyConversation, MyContext } from "../types.ts";
import { resizeImage } from "../utils/resizeImage.ts";

type StickerSet = { title: string; name: string };

export async function addStickerConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const sets = await getStickerSets(ctx);
  if (sets.length === 0) {
    return await ctx.reply(
      "You don't have any sets yet, please create a new one using /newpack!"
    );
  }
  const inline_keyboard = await getStickersInlineKeyboard(sets);
  await ctx.reply("Choose a sticker pack", { reply_markup: inline_keyboard });
  ctx = await conversation.waitFor("callback_query:data");
  const name = ctx.callbackQuery?.data!;
  await ctx.answerCallbackQuery();

  await ctx.reply("Ok! Please send a photo or a sticker you want");
  await addStickerToSet(conversation, ctx, name);

  return await ctx.reply(`Stickers added to https://t.me/addstickers/${name}`);
}

/**
 * A recursion function for adding stickers to a set.
 */
export async function addStickerToSet(
  conversation: MyConversation,
  ctx: MyContext,
  name: string
): Promise<Message.TextMessage> {
  ctx = await conversation.waitFor(["::bot_command", ":sticker", ":photo"]);

  if (ctx.message?.text === "/done") {
    return await ctx.reply("Ok, done!");
  }
  if (!(ctx.message?.sticker || ctx.message?.photo)) {
    await ctx.reply("Send a sticker or a photo");
    ctx = await conversation.waitFor([":photo", ":sticker"]);
  }

  const sticker = await processSticker(ctx);

  await ctx.reply("Send emojis for this sticker");
  ctx = await conversation.waitFor(":text");
  const emojis = ctx.message?.text!;

  const added = await addStickerToSetUtil(ctx, name, sticker, emojis);

  if (!added) {
    return await ctx.reply(
      "Something went wrong! Please try again /addSticker"
    );
  }

  await ctx.reply("Sticker added!, send another sticker or /done to stop.");
  return addStickerToSet(conversation, ctx, name);
}

/**
 * Resize sticker size to 512px
 * Corrently, it doesn't support resizing .webp stickers
 */
export async function processSticker(
  ctx: MyContext
): Promise<string | InputFile> {
  if (ctx.message?.sticker) return ctx.message.sticker.file_id;

  const { width, height } = ctx.message?.photo?.[0]!;
  const file = await ctx.getFile();
  return await resizeImage(file.getUrl(), width, height);
}

/**
 * Add stickers to sticker pack
 */
async function addStickerToSetUtil(
  ctx: MyContext,
  name: string,
  sticker: string | InputFile,
  emojis: string
) {
  try {
    await ctx.api.addStickerToSet(ctx.from!.id, name, emojis, {
      png_sticker: sticker as any,
    });
    return true;
  } catch {
    return false;
  }
}

async function getTitleFromName(name: string) {
  const { title } = await bot.api.getStickerSet(name);
  return title;
}

async function getStickerSets(ctx: MyContext) {
  const sets: StickerSet[] = [];
  if (ctx.session.sets.size === 0) return [];

  for (const name of ctx.session.sets) {
    try {
      const title = await getTitleFromName(name);
      sets.push({
        title,
        name,
      });
    } catch {
      ctx.session.sets.delete(name);
    }
  }

  return sets;
}

async function getStickersInlineKeyboard(sets: StickerSet[]) {
  const keyboard = new InlineKeyboard();
  sets.forEach((set) =>
    keyboard.add({ text: set.title, callback_data: set.name })
  );
  return keyboard;
}
