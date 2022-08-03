import { MyConversation, MyContext } from "../bot.ts";
import { askSticker } from "../utils/askSticker.ts";
export async function createStickerPack(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply(
    "Hello, I am here to hlep you creating your sticker pack :)\
\n Please send a title for your sticker pack, for example: my stickers"
  );

  const title = await conversation.form.text((ctx) =>
    ctx.reply("Wrong input, you should send a title for your sticker pack")
  );

  await ctx.reply(
    "Great! Now send me a name for your sticker pack, it will be used for the url so it should be unique.\
     For example: mystickers"
  );

  const name = await askName(conversation, (ctx) =>
    ctx.reply("This pack already exists, please send another name")
  );

  const { sticker, emojis } = await askSticker(conversation);

  ctx.session.sets.add(name);
  console.log(ctx.session.sets);

  return ctx.reply(`title: ${title} name: ${name}`);
}

async function askName(
  conversation: MyConversation,
  otherwise?: (ctx: MyContext) => unknown | Promise<unknown>
) {
  const ctx = await conversation.waitFor(":text");
  let name = ctx.msg.text.replace(/[^a-zA-Z0-9]/g, "");
  const botInfo = await ctx.api.getMe();
  name += "_by_" + botInfo.username;

  if (await exists(name, ctx)) {
    await otherwise?.(ctx);
    return await conversation.skip();
  }

  return name;
}

// export async function createNewPack(
//   conversation: MyConversation,
//   ctx: MyContext
// ) {
//   await ctx.reply("Send title of the pack");

//   const title = await conversation.form.text((ctx) =>
//     ctx.reply("Wrong title, please send a valid title")
//   );

//   await ctx.reply("Send name of the pack");
//   const name = await askName(conversation, ctx);

//   await ctx.reply(
//     "Great! Now send me a photo or a sticker. Don't worry, I will resize it to be compatible with Telegram! :)"
//   );

//   ctx = await conversation.wait();
//   const { emojis, sticker, ctx: newCtx } = await askSticker(conversation, ctx);
//   ctx = newCtx;
//   try {
//     await ctx.api.createNewStickerSet(ctx.from?.id!, name, title, emojis, {
//       png_sticker: sticker,
//     });

//     ctx.session.sets.add(name);
//     await ctx.reply(
//       `Sticker added! send another sticker or send /done to stop.`
//     );
//     return await addSticker(conversation, ctx, name);
//   } catch (err) {
//     await ctx.reply("Something went wrong, please try again");
//     console.error(err);
//   }
// }

async function exists(name: string, ctx: MyContext): Promise<boolean> {
  try {
    return !!(await ctx.api.getStickerSet(name));
  } catch {
    return false;
  }
}
