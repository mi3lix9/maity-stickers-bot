import { InputFile } from "grammy";
import { bot } from "../bot.ts";
import { MyConversation, MyContext } from "../types.ts";
import { resizeImage } from "./resizeImage.ts";

export async function askSticker(
  conversation: MyConversation,
  ctx: MyContext
): Promise<{ sticker: string | InputFile; emojis: string; ctx: MyContext }> {
  // ctx = await conversation.wait();

  const sticker = await processSticker(ctx);

  if (!sticker) {
    await ctx.reply("I couldn't process your sticker, please try again");
    return await askSticker(conversation, ctx);
  }

  await ctx.reply("Great! Now send me emojis for your sticker");
  const emojis = await askEmojis(conversation, ctx);
  return { sticker, emojis, ctx };
}

async function askEmojis(
  conversation: MyConversation,
  ctx: MyContext
): Promise<string> {
  const { message } = await conversation.waitFor(":text");
  const emojis = message?.text!;
  if (!checkEmoji(emojis)) {
    await ctx.reply("I couldn't process your emojis, please try again");
    return askEmojis(conversation, ctx);
  }
  return emojis;
}

function checkEmoji(emoji: string) {
  const regex = /\p{Extended_Pictographic}/gu;

  const removeEmoji = emoji.replace(regex, "");
  return !removeEmoji.length;
}

/**
 * Resize sticker size to 512px
 * Corrently, it doesn't support resizing .webp stickers
 */
export async function processSticker(
  ctx: MyContext
): Promise<string | InputFile | undefined> {
  if (ctx.message?.sticker) {
    return ctx.message.sticker.file_id;
  }
  const file = await ctx.getFile();
  const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

  // const isImage = file.file_path?.endsWith(
  //   ".webp" || ".jpg" || ".png" || ".jpeg"
  // );
  // if (!isImage) {
  //   return undefined;
  // }
  // console.log(file.getUrl());
  // console.log(file.file_path);

  return await resizeImage(filePath);
}
