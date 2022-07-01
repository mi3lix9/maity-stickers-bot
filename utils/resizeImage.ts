import { InputFile } from "https://deno.land/x/grammy/mod.ts";
import { Image } from "https://deno.land/x/imagescript/mod.ts";
import { MyContext } from "../types.ts";

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
  // const isImage = file.file_path?.endsWith(
  //   ".webp" || ".jpg" || ".png" || ".jpeg"
  // );
  // if (!isImage) {
  //   return undefined;
  // }
  return await resizeImage(file.getUrl());
}

export async function resizeImage(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  const image = await Image.decode(buffer);
  const aspectRatio = image.width / image.height;
  const width = image.width >= image.height ? 512 : 512 / aspectRatio;
  const height = image.height >= image.width ? 512 : 512 / aspectRatio;
  image.resize(width, height);

  const newImage = await image.encode();

  return new InputFile(newImage);
}
