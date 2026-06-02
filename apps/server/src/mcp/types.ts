export type { McpToolInfo, SlackMcpConversation, SlackMcpMessage, SlackMcpUser } from "shared/types";
export type SearchMessagesInput = { query:string; after?:string; limit?:number };
export type FetchRecentMessagesInput = { after?:string; limit?:number };
export type FetchThreadInput = { conversationId:string; threadTs:string };
export type GetUserInfoInput = { userId:string };
export type GetConversationInfoInput = { conversationId:string };
