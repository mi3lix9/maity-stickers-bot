import type { Context, SessionFlavor } from "https://deno.land/x/grammy/mod.ts";
import type {
  Conversation,
  ConversationFlavor,
} from "https://deno.land/x/grammy_conversations/mod.ts";
import type { FileFlavor } from "https://deno.land/x/grammy_files/mod.ts";

interface SessionData {}

export type MyContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ConversationFlavor;

export type MyConversation = Conversation<MyContext>;
