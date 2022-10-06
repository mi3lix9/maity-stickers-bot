import { InlineKeyboard, type InputFile } from "grammy";
import { StickerSet } from "grammy/types";
import { MyContext, MyConversation } from "./bot.ts";
import { processSticker } from "./utils/resizeImage.ts";

interface CreatePack {
  title: string;
  name: string;
  sticker: InputFile | undefined;
  emojis: string;
}

export function createStickerPack(type: StickerType) {
  return (conversation: MyConversation, ctx: MyContext) =>
    new StickerGenerator(conversation, type).createNewPack(ctx);
}

export function addSticker(type: StickerType) {
  return (conversation: MyConversation, ctx: MyContext) =>
    new StickerGenerator(conversation, type).addSticker(ctx);
}

type StickerType = "PNG" | "ANIMATED" | "VIDEO";

export class StickerGenerator {
  constructor(
    private conversation: MyConversation,
    private type: StickerType
  ) {}

  async createNewPack(ctx: MyContext) {
    const title = await this.conversation.form.text((ctx) =>
      ctx.reply("Wrong input, you should send a title for your sticker pack")
    );

    await ctx.reply(
      "Great! Now send me a name for your sticker pack, it will be used for the url so it should be unique.\
     For example: mystickers"
    );

    const name = await this.#askName((ctx) =>
      ctx.reply("This pack already exists, please send another name")
    );

    const { emojis, sticker } = await this.#askSticker();

    await this.#createPack(ctx, { name, title, emojis, sticker });

    await ctx.reply(
      "Sticker pack created succefully! Send another sticker if you want to add more, or send /done to stop."
    );

    ctx = await this.conversation.wait();
    ctx.session.sets.set(name, { name, type: this.type });

    return await this.#addSticker(ctx, name);
  }

  async addSticker(ctx: MyContext) {
    const stickers = this.#getStickerPacks(ctx);
    if (stickers.length === 0) {
      return await ctx.reply(
        "You don't have any packs, please create a new one by /newpack"
      );
    }
    const name = await this.#askPack(ctx, stickers);
    return await this.#addSticker(ctx, name);
  }

  async #createPack(
    ctx: MyContext,
    { title, emojis, name, sticker }: CreatePack
  ) {
    try {
      if (this.type === "PNG") {
        await ctx.api.createNewStickerSet(ctx.from?.id!, name, title, emojis, {
          png_sticker: sticker,
        });
      }
      if (this.type === "ANIMATED") {
        await ctx.api.createNewStickerSet(ctx.from?.id!, name, title, emojis, {
          tgs_sticker: sticker,
        });
      }
      if (this.type === "VIDEO") {
        await ctx.api.createNewStickerSet(ctx.from?.id!, name, title, emojis, {
          webm_sticker: sticker,
        });
      }
    } catch (error) {
      console.log(error);
      return await ctx.reply("Something went wrong, please try again later :(");
    }
  }

  async #addSticker(ctx: MyContext, name: string): Promise<unknown> {
    const { emojis, sticker } = await this.#askSticker();

    await ctx.api.addStickerToSet(ctx.from?.id!, name, emojis, {
      png_sticker: sticker,
    });

    await ctx.reply(
      "Sticker added to pack, send another sticker if you want, or send /done to stop."
    );

    ctx = await this.conversation.wait();

    if (ctx.has(":text") && ctx.message?.text.toLocaleLowerCase() === "/done")
      return await ctx.reply(
        `Your sticker pack is: https://t.me/addstickers/${name}`
      );

    return await this.#addSticker(ctx, name);
  }

  async #askName(otherwise?: (ctx: MyContext) => unknown | Promise<unknown>) {
    const ctx = await this.conversation.waitFor(":text");
    let name = ctx.msg.text.replace(/[^a-zA-Z0-9]/g, "");
    const botInfo = await ctx.api.getMe();
    name += "_by_" + botInfo.username;

    if (await this.#exists(name, ctx)) {
      await otherwise?.(ctx);
      return await this.conversation.skip();
    }

    return name;
  }

  async #exists(name: string, ctx: MyContext): Promise<boolean> {
    try {
      return !!(await ctx.api.getStickerSet(name));
    } catch {
      return false;
    }
  }

  async #askSticker() {
    const ctx = await this.conversation.waitFor([
      ":sticker",
      ":photo",
      ":file",
    ]);
    const sticker = await processSticker(ctx);

    if (!sticker) {
      await ctx.reply(
        "I couldn't process your sticker, send a valid photo or sticker"
      );
      return await this.conversation.skip();
    }

    await ctx.reply("Great! Now send me emojis for your sticker");
    const emojis = await this.#askEmojis();
    return { sticker, emojis };
  }

  async #askEmojis() {
    const ctx = await this.conversation.waitFor(":text");
    const emojis = ctx.message?.text!;
    if (!this.#checkEmoji(emojis)) {
      await ctx.reply("I couldn't process your emojis, please send emojis");
      return await this.conversation.skip();
    }
    return emojis;
  }

  #checkEmoji(emojis: string) {
    const regex = /\p{Extended_Pictographic}/gu;

    const removeEmoji = emojis.replace(regex, "");
    return !removeEmoji.length;
  }

  async #askPack(ctx: MyContext, packs: StickerSet[]) {
    const keyboard = new InlineKeyboard();
    packs.forEach((pack) =>
      keyboard.add({ text: pack.title, callback_data: pack.name })
    );
    await ctx.reply("Choose pack you want to add sticker to", {
      reply_markup: keyboard,
    });

    ctx = await this.conversation.waitFor("callback_query:data");
    const chosenPack = ctx.callbackQuery?.data!;
    // await ctx.answerCallbackQuery(); // This function causes an error
    await ctx.editMessageText(`You chose ${chosenPack}`);
    return chosenPack;
  }

  #getStickerPacks(ctx: MyContext) {
    const sets: StickerSet[] = [];

    ctx.session.sets.forEach(async (set) => {
      if (set.type !== this.type) return;

      try {
        const mySet = await ctx.api.getStickerSet(set.name);
        sets.push(mySet);
      } catch {
        ctx.session.sets.delete(set.name);
      }
    });
    return sets;
  }
}
