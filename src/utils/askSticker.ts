import { InputFile } from "grammy";
import { MyConversation, MyContext } from "../bot.ts";
import { resizeImage } from "./resizeImage.ts";

export async function askSticker(
  conversation: MyConversation
): Promise<{ sticker: string | InputFile; emojis: string }> {
  const ctx = await conversation.waitFor([":sticker", ":photo", ":file"]);
  const sticker = await processSticker(ctx);

  if (!sticker) {
    await ctx.reply(
      "I couldn't process your sticker, send a valid photo or sticker"
    );
    return await conversation.skip();
  }

  await ctx.reply("Great! Now send me emojis for your sticker");
  const emojis = await askEmojis(conversation);
  return { sticker, emojis };
}

async function askEmojis(conversation: MyConversation): Promise<string> {
  const ctx = await conversation.waitFor(":text");
  const emojis = ctx.message?.text!;
  if (!checkEmoji(emojis)) {
    await ctx.reply("I couldn't process your emojis, please send emojis");
    return await conversation.skip();
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
  const filePath = `https://api.telegram.org/file/bot${Deno.env.get(
    "BOT_TOKEN"
  )}/${file.file_path}`;
  try {
    return await resizeImage(filePath);
  } catch {
    return undefined;
  }
}
