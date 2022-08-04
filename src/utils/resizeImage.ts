import { InputFile } from "grammy";
import { Image } from "imagescript";

import { Tinify } from "https://deno.land/x/tinify/mod.ts";

const TINIFY_KEY = Deno.env.get("TINIFY_KEY");

if (typeof TINIFY_KEY === "undefined") {
  throw new Error("TINIFY_KEY is not set");
}

export async function resizeImage(url: string) {
  const tinify = new Tinify({
    api_key: TINIFY_KEY!,
  });

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const image = await Image.decode(buffer);
  const aspectRatio = image.width / image.height;

  const width = image.width > 512 ? 512 / aspectRatio : image.width;
  const height = image.height > 512 ? 512 / aspectRatio : image.height;
  image.resize(width, height);

  const newImage = await image.encode();
  const compressedImage = await tinify.compress(newImage);

  return new InputFile(await compressedImage.toBase64());
}
