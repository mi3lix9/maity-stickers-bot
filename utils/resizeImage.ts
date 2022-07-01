import { InputFile } from "https://deno.land/x/grammy/mod.ts";
import { Image } from "https://deno.land/x/imagescript/mod.ts";

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
