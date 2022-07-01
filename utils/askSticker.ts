import { InputFile } from "https://deno.land/x/grammy/mod.ts";
import { MyConversation, MyContext } from "../types.ts";
import { processSticker } from "./resizeImage.ts";

export async function askSticker(
  conversation: MyConversation,
  ctx: MyContext
): Promise<{ sticker: string | InputFile; emojis: string }> {
  // ctx = await conversation.wait();

  const sticker = await conversation.external(() => processSticker(ctx));

  if (!sticker) {
    await ctx.reply("I couldn't process your sticker, please try again");
    return await askSticker(conversation, ctx);
  }

  await ctx.reply("Great! Now send me emojis for your sticker");
  const emojis = await askEmojis(conversation, ctx);
  return { sticker, emojis };
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
