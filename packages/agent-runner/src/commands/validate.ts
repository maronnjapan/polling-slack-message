import { readChats, readMessages, readReplies, readRuns, readTodos } from "../readers/fileStore.js";

export async function validateData() {
  const [messages, todos, replies, chats, runs] = await Promise.all([readMessages(), readTodos(), readReplies(), readChats(), readRuns()]);
  return { messages: messages.length, todos: todos.length, replies: replies.length, chats: chats.length, runs: runs.length };
}
