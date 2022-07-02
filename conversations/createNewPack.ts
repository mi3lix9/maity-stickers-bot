import { MyConversation, MyContext } from "../types.ts";
import { askSticker } from "../utils/askSticker.ts";
import { addSticker } from "./addSticker.ts";

export async function createNewPack(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply("Send title of the pack");
  ctx = await conversation.wait();
  const title = ctx.message?.text!;

  await ctx.reply("Send name of the pack");
  const name = await askName(conversation, ctx);
  console.log(ctx.session);
  // ctx.session.sets.add(name);
  ctx.session.newSets.push(name);

  await ctx.reply(
    "Great! Now send me a photo or a sticker. Don't worry, I will resize it to be compatible with Telegram! :)"
  );

  ctx = await conversation.wait();
  const { emojis, sticker } = await askSticker(conversation, ctx);

  await ctx.api.createNewStickerSet(ctx.from?.id!, name, title, emojis, {
    png_sticker: sticker,
  });

  await ctx.reply(`Sticker added! send another sticker or send /done to stop.`);
  return await addSticker(conversation, ctx, name);
}

async function askName(
  conversation: MyConversation,
  ctx: MyContext
): Promise<string> {
  const { message } = await conversation.waitFor(":text");
  const rawName = message?.text!;
  // Regex to remove spaces and special characters
  let name = rawName.replace(/[^a-zA-Z0-9]/g, "");
  // Telegram requires bot name to ba part of the pack name
  const botInfo = await ctx.api.getMe();
  name += "_by_" + botInfo.username;

  // if (new RegExp(/[^a-zA-Z0-9]/g).test(rawName)) {
  //   await ctx.reply(
  //     `This name contains invalid characters but I tried to fix it, would you like to the name to be ${name}?`,
  //     {
  //       reply_markup: {
  //         keyboard: new Keyboard().add("Yes", "No").build(),
  //         resize_keyboard: true,
  //         one_time_keyboard: true,
  //       },
  //     }
  //   );
  //   const { message } = await conversation.waitFor(":text");
  //   if (message?.text.toLocaleLowerCase() === "no") {
  //     await ctx.reply("Ok, send a new name for your pack");
  //     return askName(conversation, ctx);
  //   }
  // }

  if (await exists(name, ctx)) {
    await ctx.reply("This pack already exists, please send another name");
    return await askName(conversation, ctx);
  }

  return name;
}

async function exists(name: string, ctx: MyContext): Promise<boolean> {
  try {
    await ctx.api.getStickerSet(name);
    return true;
  } catch {
    return false;
  }
}
