import { InlineKeyboard } from "grammy";
import { StickerSet } from "@grammy/types";
import { askSticker } from "../utils/askSticker.ts";
import { MyContext, MyConversation } from "../bot.ts";

export async function addSticker(
  conversation: MyConversation,
  ctx: MyContext,
  name?: string
): Promise<void> {
  if (!name) {
    return await addStickerUtil(conversation, ctx);
  }

  ctx = await conversation.wait();

  if (ctx.message?.text?.toLocaleLowerCase() === "/done") {
    await ctx.reply(`Your sticker pack is: https://t.me/addstickers/${name}`);
    return;
  }

  const { emojis, sticker } = await askSticker(conversation);

  await ctx.api.addStickerToSet(ctx.from?.id!, name, emojis, {
    png_sticker: sticker,
  });

  await ctx.reply(
    "Sticker added to pack, send another sticker if you want, or send /done to stop."
  );

  return await addSticker(conversation, ctx, name);
}

async function addStickerUtil(conversation: MyConversation, ctx: MyContext) {
  const packs = await getStickerPacks(ctx);

  if (packs.length === 0) {
    await ctx.reply(
      "You don't have any packs, please create a new one by /newpack"
    );
    return;
  }

  const name = await askPack(conversation, ctx, packs);
  await ctx.reply("Great! now send a sticker to add to your pack");

  return await addSticker(conversation, ctx, name);
}

async function askPack(
  conversation: MyConversation,
  ctx: MyContext,
  packs: StickerSet[]
) {
  const keyboard = new InlineKeyboard();
  packs.forEach((pack) =>
    keyboard.add({ text: pack.title, callback_data: pack.name })
  );
  await ctx.reply("Choose pack you want to add sticker to", {
    reply_markup: keyboard,
  });

  ctx = await conversation.waitFor("callback_query:data");
  const chosenPack = ctx.callbackQuery?.data!;
  // await ctx.answerCallbackQuery(); // This function causes an error
  await ctx.editMessageText(`You chose ${chosenPack}`);
  return chosenPack;
}

async function getStickerPacks(ctx: MyContext) {
  const sets = ctx.session.sets;

  const packs: StickerSet[] = [];

  for (const set of sets) {
    try {
      const pack = await ctx.api.getStickerSet(set);
      packs.push(pack);
    } catch {
      sets.delete(set);
    }
  }
  return packs;
}
