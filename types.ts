import type { Context, SessionFlavor } from "https://deno.land/x/grammy/mod.ts";
import type {
  Conversation,
  ConversationFlavor,
} from "https://deno.land/x/grammy_conversations/mod.ts";
// import type { FileFlavor } from "https://deno.land/x/grammy_files/mod.ts";

export interface SessionData {
  /**
   * set of sticker sets' names
   */
  sets: Set<string>;
  newSets: string[];
  /**
   * fast mode enable users to add stickers automatically to special packs
   * without the need to add title,name, or emojies to the set.
   *
   * Currently doesn't do anything.
   */
  fastMode: boolean;
}

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor;

export type MyConversation = Conversation<MyContext>;
