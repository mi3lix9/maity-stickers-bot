import { InputFile } from "grammy";
import { createTGSFile } from "./TGSKit.ts";
import { Animation } from "https://esm.sh/@lottiefiles/lottie-js";
import { MyContext } from "../bot.ts";
import { Image } from "imagescript";

export async function processSticker(ctx: MyContext) {
  if (ctx.has(":sticker")) {
    return ctx.message?.sticker.file_id;
  }

  const path = await getPath(ctx);
  const buffer = await getImage(path);
  const type = path.split(".").pop()?.toLowerCase();
  const isPng = type === "png" || type === "jpeg";
  if (ctx.has(":photo") || isPng) {
    return processPNG(buffer);
  }

  if (type === "svg") return processSVG(buffer);

  throw new Error("File type is not supported.");
}

async function getImage(path: string) {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return buffer;
}

async function processPNG(buffer: ArrayBuffer) {
  const image = await Image.decode(buffer);
  const resized = resizeImage(image);
  const file = await resized.encode();
  return new InputFile(file);
}

function processSVG(buffer: ArrayBuffer) {
  const image = new Animation().fromJSON(buffer);
  const resized = resizeImage(image);
  const json = resized.toJSON()!;
  const { file, errors } = createTGSFile(json);

  if (errors) {
    throw new Error("File is not compatible");
  }
  return new InputFile(file, "sticker.tgs");
}

async function getPath(ctx: MyContext) {
  const file = await ctx.getFile();
  const filePath = `https://api.telegram.org/file/bot${Deno.env.get(
    "BOT_TOKEN"
  )}/${file.file_path}`;

  return filePath;
}

function resizeImage<T extends { width: number; height: number }>(image: T) {
  const aspectRatio = image.width / image.height;
  const width = image.width > 512 ? 512 / aspectRatio : image.width;
  const height = image.height > 512 ? 512 / aspectRatio : image.height;

  image.width = width;
  image.height = height;

  return image;
}
