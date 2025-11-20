import { Context, TypedResponse } from "hono";
import * as AiChatService from "$services/AiChat";
import * as SimpleChatService from "$services/AiChat/SimpleChatService";
import {
  handleServiceErrorWithResponse,
  response_created,
  response_success,
} from "$utils/response.utils";
import { AiChatRoomDTO } from "$entities/AiChatRoom";
import * as EzFilter from "@nodewave/prisma-ezfilter";
import { UserJWTDAO } from "$entities/User";
import { z } from "zod";

export async function createChatRoom(c: Context): Promise<TypedResponse> {
  const data: AiChatRoomDTO = await c.req.json();
  const user: UserJWTDAO = c.get("jwtPayload");
  const tenantId = c.req.param("tenantId");

  const serviceResponse = await AiChatService.Chat.createChatRoom(
    data,
    user.id,
    tenantId
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_created(
    c,
    serviceResponse.data,
    "Successfully created new AiChatRoom!"
  );
}

export async function getAllChatRooms(c: Context): Promise<TypedResponse> {
  const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
    c.req.query()
  );
  const user: UserJWTDAO = c.get("jwtPayload");
  const tenantId = c.req.param("tenantId");
  const serviceResponse = await AiChatService.Chat.getAllChatRooms(
    filters,
    user.id,
    tenantId
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched all AiChatRoom!"
  );
}

export async function getChatRoomById(c: Context): Promise<TypedResponse> {
  const chatRoomId = c.req.param("chatRoomId");
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await AiChatService.Chat.getChatRoomById(
    chatRoomId,
    user.id
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched AiChatRoom by id!"
  );
}

export async function updateChatRoom(c: Context): Promise<TypedResponse> {
  const data: AiChatRoomDTO = await c.req.json();
  const chatRoomId = c.req.param("chatRoomId");
  const user: UserJWTDAO = c.get("jwtPayload");
  const serviceResponse = await AiChatService.Chat.updateChatRoom(
    chatRoomId,
    data,
    user.id
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully updated AiChatRoom!"
  );
}

export async function deleteChatRoomById(c: Context): Promise<TypedResponse> {
  const chatRoomId = c.req.param("chatRoomId");
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await AiChatService.Chat.deleteChatRoomById(
    chatRoomId,
    user.id
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully deleted AiChatRoom!"
  );
}

export async function getChatRoomHistory(c: Context): Promise<TypedResponse> {
  const chatRoomId = c.req.param("chatRoomId");
  const filters: EzFilter.FilteringQuery = EzFilter.extractQueryFromParams(
    c.req.query()
  );
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await AiChatService.Chat.getChatRoomHistory(
    chatRoomId,
    filters,
    user.id
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched AiChatRoom history!"
  );
}

export async function chat(c: Context): Promise<TypedResponse> {
  const question = await c.req.json();
  const chatRoomId = c.req.param("chatRoomId");
  const user: UserJWTDAO = c.get

("jwtPayload");

  const serviceResponse = await AiChatService.Chat.chat(
    question,
    chatRoomId,
    user.id
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully sent message to AiChatRoom!"
  );
}

const StreamChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().optional(),
      parts: z.array(z.any()).optional(),
    })
  ).optional(),
  message: z.string().optional(), // Support single message format from AI SDK
  chatRoomId: z.string().optional(), // Optional for new chats
});

export async function streamMessage(c: Context): Promise<Response> {
  const user = c.get("jwtPayload");
  const tenantId = c.req.param("tenantId");
  const chatRoomId = c.req.param("chatRoomId");

  const body = await c.req.json();
  const parseResult = StreamChatSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      { error: "Invalid request body", details: parseResult.error },
      400
    );
  }

  // Handle both single message and array formats
  let messages = parseResult.data.messages;
  
  // Convert single message to array format
  if (!messages && parseResult.data.message) {
    console.log("Converting single message to array format");
    messages = [{
      role: "user",
      content: parseResult.data.message,
      parts: [{ type: "text", text: parseResult.data.message }]
    }];
  }

  if (!messages || messages.length === 0) {
    return c.json({ error: "Messages are required" }, 400);
  }

  // Convert to ModelMessage format
  const modelMessages = messages.map((m: any) => {
    let content = m.content;
    if (!content && m.parts) {
      // Simple conversion: join text parts
      content = m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return {
      role: m.role,
      content: content || "",
    };
  });

  // For new chats, the chatRoomId might not exist yet.
  // The frontend will handle creating the room first.
  // For now, we assume chatRoomId is always present.
  if (!chatRoomId) {
    return c.json({ error: "Chat Room ID is required" }, 400);
  }

  return SimpleChatService.streamSimpleChat(
    modelMessages,
    chatRoomId,
    tenantId,
    user.id
  );
}
