# SSL Certificate Troubleshooting

## Error yang Sering Terjadi

```
"UNABLE_TO_VERIFY_LEAF_SIGNATURE"
"unable to verify the first certificate"
```

## Penyebab Error

1. **Self-signed certificate** pada AI client API
2. **Certificate chain tidak lengkap**
3. **Environment development** yang menggunakan sertifikat tidak valid
4. **Proxy atau firewall** yang mengganggu koneksi SSL

## Solusi

### 1. Konfigurasi Environment Variable

Tambahkan ke file `.env`:

```env
# AI Client Configuration
AI_API_URL=https://your-ai-client-api.com
AI_API_SSL_VERIFY=false  # Set ke false untuk development
```

### 2. Untuk Development

Set `AI_API_SSL_VERIFY=false` untuk menonaktifkan SSL verification:

```env
AI_API_SSL_VERIFY=false
```

### 3. Untuk Production

Set `AI_API_SSL_VERIFY=true` untuk memastikan keamanan:

```env
AI_API_SSL_VERIFY=true
```

### 4. Menggunakan HTTP (Development Only)

Untuk development, Anda bisa menggunakan HTTP:

```env
AI_API_URL=http://your-ai-client-api.com
AI_API_SSL_VERIFY=false
```

⚠️ **PENTING**: Jangan gunakan HTTP di production karena data tidak dienkripsi.

## Testing Koneksi

### 1. Test dengan curl

```bash
# Test dengan SSL verification
curl -v https://your-ai-client-api.com/health

# Test tanpa SSL verification
curl -k -v https://your-ai-client-api.com/health
```

### 2. Test dengan Node.js

```javascript
const https = require("https")

// Dengan SSL verification
const options1 = {
    hostname: "your-ai-client-api.com",
    port: 443,
    path: "/health",
    method: "GET",
}

// Tanpa SSL verification
const options2 = {
    hostname: "your-ai-client-api.com",
    port: 443,
    path: "/health",
    method: "GET",
    rejectUnauthorized: false,
}
```

## Logging

Aplikasi akan menampilkan log berikut untuk debugging:

```
Making request to: https://your-ai-client-api.com/stream
{
  sslVerify: false,
  timeout: 30000
}
```

## Keamanan

⚠️ **PENTING**: Jangan set `AI_API_SSL_VERIFY=false` di production karena akan membuat aplikasi rentan terhadap man-in-the-middle attacks.

## Troubleshooting Steps

1. **Cek URL AI API**: Pastikan `AI_API_URL` benar
2. **Cek SSL Certificate**: Gunakan browser atau curl untuk test
3. **Cek Environment**: Pastikan `NODE_ENV` dan `AI_API_SSL_VERIFY` sesuai
4. **Cek Network**: Pastikan tidak ada proxy atau firewall yang memblokir
5. **Cek Logs**: Lihat log untuk detail error yang lebih spesifik
