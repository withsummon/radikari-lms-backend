# Integrasi AI Client Streaming Response

Dokumentasi ini menjelaskan bagaimana mengintegrasikan response streaming dari AI Client ke dalam sistem chat.

## Format Response dari AI Client

AI Client mengirim response dalam format Server-Sent Events (SSE) dengan struktur berikut:

```
event: message
data: {"type": "content", "content": "Based on"}

event: message
data: {"type": "content", "content": " your"}

event: message
data: {"type": "content", "content": " company's HR policy,"}

event: sources
data: {"type": "sources", "sources": [{"id": "doc-123", "title": "HR Policy", "content": "Employee handbook section..."}]}

event: end
data: {"type": "end"}
```

## Event Types

### 1. Content Events (`event: message`)

-   **Type**: `content`
-   **Purpose**: Mengirim konten AI response secara streaming
-   **Data Structure**:
    ```json
    {
        "type": "content",
        "content": "Text content dari AI"
    }
    ```

### 2. Sources Events (`event: sources`)

-   **Type**: `sources`
-   **Purpose**: Mengirim referensi/sumber yang digunakan AI
-   **Data Structure**:
    ```json
    {
        "type": "sources",
        "sources": [
            {
                "id": "doc-123",
                "title": "HR Policy",
                "content": "Employee handbook section..."
            }
        ]
    }
    ```

### 3. End Events (`event: end`)

-   **Type**: `end`
-   **Purpose**: Menandai akhir dari streaming response
-   **Data Structure**:
    ```json
    {
        "type": "end"
    }
    ```

## Implementasi Backend

### 1. Interface Types

```typescript
// src/entities/AiChatRoomMessage.ts
export interface AiClientContentResponse {
    type: "content"
    content: string
}

export interface AiClientSourceResponse {
    type: "sources"
    sources: AiClientSource[]
}

export interface AiClientEndResponse {
    type: "end"
}

export interface AiClientSource {
    id: string
    title: string
    content: string
}

export type AiClientResponse =
    | AiClientContentResponse
    | AiClientSourceResponse
    | AiClientEndResponse
```

### 2. Database Schema

```prisma
model AiChatRoomMessage {
  id                   String                  @id @unique
  aiChatRoomId         String
  sender               AiChatRoomMessageSender
  message              String
  htmlFormattedMessage String?
  knowledgeId          String?
  createdAt            DateTime                @default(now())
  updatedAt            DateTime                @updatedAt

  aiChatRoom                 AiChatRoom                   @relation(fields: [aiChatRoomId], references: [id], onDelete: Cascade)
  knowledge                  Knowledge?                   @relation(fields: [knowledgeId], references: [id], onDelete: Cascade)
  aiChatRoomMessageKnowledge AiChatRoomMessageKnowledge[]
}

model AiChatRoomMessageKnowledge {
  id                  String @id @unique
  aiChatRoomMessageId String
  knowledgeId         String

  aiChatRoomMessage AiChatRoomMessage @relation(fields: [aiChatRoomMessageId], references: [id], onDelete: Cascade)
  knowledge         Knowledge         @relation(fields: [knowledgeId], references: [id], onDelete: Cascade)
}
```

### 3. Streaming Function

Fungsi `streamMessage` telah diupdate untuk:

-   Parse SSE format dengan benar
-   Menangani berbagai event types
-   Menyimpan sources ke database
-   Mengirim response dalam format yang konsisten ke frontend

## Implementasi Frontend

### 1. EventSource Setup

```javascript
const eventSource = new EventSource("/api/chat/stream")

// Handle content streaming
eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data)

    if (data.type === "content") {
        appendToChat(data.content)
    }
})

// Handle sources
eventSource.addEventListener("sources", (event) => {
    const data = JSON.parse(event.data)

    if (data.type === "sources") {
        displaySources(data.sources)
    }
})

// Handle end
eventSource.addEventListener("end", (event) => {
    eventSource.close()
    enableSendButton()
})

// Handle errors
eventSource.addEventListener("error", (event) => {
    console.error("Stream error:", event)
    eventSource.close()
})
```

### 2. Response Format ke Frontend

Backend mengirim response dalam format:

```
event: message
data: {"type": "content", "content": "Based on"}

event: message
data: {"type": "content", "content": " your"}

event: sources
data: {"type": "sources", "sources": [...]}

event: end
data: {"type": "end"}
```

## Migration Database

Jalankan migrasi untuk menambahkan model `AiChatRoomMessageKnowledge`:

```bash
npx prisma migrate dev --name add_many_to_many_chat_message_knowledge
```

## Controller Implementation

Controller `streamMessage` telah disesuaikan untuk menggunakan implementasi baru:

```typescript
export async function streamMessage(c: Context) {
    const formData = await c.req.parseBody({ all: true })
    const message = formData["message"] as string
    const chatRoomId = c.req.param("chatRoomId")
    const user: UserJWTDAO = c.get("jwtPayload")

    if (!message) {
        return c.json({ error: "Message is required" }, 400)
    }

    const payload: AiChatRoomMessageCreateDTO = {
        question: message,
    }

    const streamData = new ReadableStream({
        async start(controller) {
            try {
                // Set headers untuk Server-Sent Events
                controller.enqueue(
                    `data: ${JSON.stringify({
                        event: "start",
                        data: { message: "Starting AI response..." },
                    })}\n\n`
                )

                await AiChatService.Chat.streamMessage(
                    user,
                    chatRoomId,
                    payload,
                    (chunk: string) => {
                        try {
                            const parsedChunk = JSON.parse(chunk)

                            // Format response sesuai dengan SSE standard
                            const eventType = parsedChunk.event || "message"
                            const data = parsedChunk.data || chunk

                            // Kirim ke client dalam format SSE
                            controller.enqueue(`event: ${eventType}\n`)
                            controller.enqueue(`data: ${data}\n\n`)
                        } catch (error) {
                            console.error("Error parsing chunk:", error)
                            // Kirim raw data jika parsing gagal
                            controller.enqueue(`event: message\n`)
                            controller.enqueue(`data: ${chunk}\n\n`)
                        }
                    }
                )

                // Stream selesai
                controller.enqueue(`event: end\n`)
                controller.enqueue(`data: ${JSON.stringify({ type: "end" })}\n\n`)
            } catch (err) {
                console.error("Error in streaming chat:", err)
                controller.enqueue(`event: error\n`)
                controller.enqueue(
                    `data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`
                )
            } finally {
                controller.close()
            }
        },
    })

    return response_stream(c, streamData as ReadableStream)
}
```

## Error Handling

-   Invalid JSON dalam stream akan di-log dan raw data tetap dikirim
-   Connection error akan menutup stream dan mengirim error event
-   Database transaction error akan di-rollback

## Testing

Gunakan contoh di `src/examples/streaming-integration-example.ts` untuk testing integrasi.

## Keuntungan Implementasi Ini

1. **Real-time Streaming**: User melihat response AI secara real-time
2. **Source Attribution**: Sources/references tersimpan dan dapat ditampilkan
3. **Robust Error Handling**: Menangani berbagai error scenarios
4. **Database Persistence**: Semua data tersimpan untuk history
5. **Type Safety**: Full TypeScript support dengan proper interfaces
