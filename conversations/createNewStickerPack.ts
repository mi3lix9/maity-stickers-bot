import { addStickerToSet, processSticker } from "./addSticker.ts";
import { bot } from "../bot.ts";
import { MyConversation, MyContext } from "../types.ts";
import { InputFile } from "https://deno.land/x/grammy/platform.deno.ts";
export async function createStickerSetConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply("Send a title for your pack");
  ctx = await conversation.waitFor(":text");
  const title = ctx.message?.text!;

  await ctx.reply(
    "Send a name for your pack (should be unique and without spaces)"
  );
  ctx = await conversation.waitFor(":text");
  const name = await validatedName(ctx, conversation, ctx.message?.text!);

  await ctx.reply("Send a photo or sticker");
  ctx = await conversation.waitFor([":sticker", ":photo"]);
  const sticker = await processSticker(ctx);

  await ctx.reply("Send emojis for this sticker");
  ctx = await conversation.waitFor(":text");
  const emojis = ctx.message?.text!;
  const isCreated = await createNewStickerSetUtil(
    ctx,
    name,
    title,
    sticker,
    emojis
  );

  if (!isCreated) {
    return ctx.reply("Something wrong happend.");
  }
  await ctx.reply(
    `Sticker pack created!: \n https://t.me/addstickers/${name} \n\n you can send more stickers, or send /done to stop`
  );

  ctx.session.sets.add(name);
  return await addStickerToSet(conversation, ctx, name);
}

async function validatedName(
  ctx: MyContext,
  conversation: MyConversation,
  name: string
): Promise<string> {
  if (ctx.message?.text?.includes(" ")) {
    await ctx.reply("Please send a name without a space");
    ctx = await conversation.waitFor(":text");
    return validatedName(ctx, conversation, ctx.message?.text!);
  }

  if (await checkNotAvailable(name)) {
    await ctx.reply("This name is already exist, please send a new name!");
    ctx = await conversation.waitFor(":text");
    return validatedName(ctx, conversation, ctx.message?.text!);
  }

  const getBot = await bot.api.getMe();
  name += "_by_" + getBot.username;

  return name;
}

async function checkNotAvailable(name: string) {
  try {
    await bot.api.getStickerSet(name);
    return false;
  } catch {
    return true;
  }
}

async function createNewStickerSetUtil(
  ctx: MyContext,
  name: string,
  title: string,
  sticker: string | InputFile,
  emojis: string
) {
  try {
    await ctx.api.createNewStickerSet(ctx.from!.id, name!, title!, emojis!, {
      png_sticker: sticker as any,
    });
    return true;
  } catch {
    return false;
  }
}
