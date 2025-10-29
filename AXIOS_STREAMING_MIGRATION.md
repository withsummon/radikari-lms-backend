# Migrasi dari Fetch ke Axios untuk Streaming

## Perubahan yang Dilakukan

### 1. **Repository Layer (`AiChatRoomRepository.ts`)**

#### **Sebelum (Fetch):**
```typescript
const response = await fetch(fullUrl, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
        "Content-Type": "application/json",
    },
})
```

#### **Sesudah (Axios):**
```typescript
const response = await axios({
    method: "POST",
    url: fullUrl,
    data: data,
    headers: {
        "Content-Type": "application/json",
    },
    responseType: "stream",
    httpsAgent: httpsAgent,
    timeout: 30000,
})
```

### 2. **Service Layer (`ChatService.ts`)**

#### **Sebelum (Fetch Response):**
```typescript
const reader = response.body!.getReader()
const decoder = new TextDecoder()

while (!done) {
    const { value, done: isDone } = await reader.read()
    if (isDone) break
    // Process chunks...
}
```

#### **Sesudah (Axios Stream):**
```typescript
const stream = response.data
const decoder = new TextDecoder()

for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true })
    // Process chunks...
}
```

## Keuntungan Menggunakan Axios

### 1. **SSL Configuration yang Lebih Baik**
- Kontrol penuh atas SSL verification
- Support untuk custom certificates
- Environment-based configuration

### 2. **Error Handling yang Lebih Baik**
- Axios error types yang spesifik
- Detailed error information
- Better timeout handling

### 3. **Streaming yang Lebih Stabil**
- Native Node.js stream support
- Better buffer management
- More reliable chunk processing

## Konfigurasi SSL

### **Environment Variables:**
```env
AI_API_URL=http://your-ai-client-api.com
AI_API_SSL_VERIFY=false  # false untuk development, true untuk production
```

### **SSL Agent Configuration:**
```typescript
const httpsAgent = new https.Agent({
    rejectUnauthorized: sslVerify,
})
```

## Error Handling

### **Axios Error Types:**
```typescript
if (axios.isAxiosError(error)) {
    console.error("Axios error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
    })
}
```

## Streaming Response Processing

### **Buffer Management:**
```typescript
let buffer = ""

for await (const chunk of stream) {
    const text = decoder.decode(chunk, { stream: true })
    buffer += text
    
    // Process complete lines
    const lines = buffer.split("\n")
    buffer = lines.pop() || "" // Keep incomplete line in buffer
}
```

## Testing

### **Test dengan curl:**
```bash
# HTTP
curl -v http://your-ai-client-api.com/chat/stream-sse

# HTTPS tanpa SSL verification
curl -k -v https://your-ai-client-api.com/chat/stream-sse
```

### **Test dengan Postman:**
- Gunakan URL yang sama dengan environment variable
- Pastikan method POST
- Set Content-Type: application/json

## Troubleshooting

### **Common Issues:**

1. **SSL Certificate Error:**
   - Set `AI_API_SSL_VERIFY=false` untuk development
   - Pastikan URL menggunakan HTTP jika tidak ada SSL

2. **Stream Not Working:**
   - Pastikan `responseType: "stream"` di axios config
   - Cek apakah server mendukung streaming response

3. **Timeout Issues:**
   - Adjust `timeout` value di axios config
   - Cek network connectivity

## Migration Checklist

- [x] Update repository untuk menggunakan axios
- [x] Update service untuk menggunakan Node.js stream
- [x] Add SSL configuration
- [x] Add error handling
- [x] Add buffer management untuk streaming
- [x] Test dengan HTTP dan HTTPS
- [x] Update documentation
