import { resize } from "https://deno.land/x/deno_image/index.ts";
import { InputFile } from "https://deno.land/x/grammy/platform.deno.ts";

export async function resizeImage(url: string, width: number, height: number) {
  const aspectRatio = width / height;
  const newWidth = width >= height ? 512 : 512 / aspectRatio;
  const newHeight = height >= width ? 512 : 512 / aspectRatio;

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const uint = new Uint8Array(buffer);

  const newSticker = await resize(uint, {
    width: newWidth,
    height: newHeight,
  });
  return new InputFile(newSticker);
}
