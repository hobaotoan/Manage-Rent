# Deploy lên Railway

Railway hỗ trợ SQLite với persistent storage - phù hợp nhất cho project này.

## Các bước deploy

### 1. Cài Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2. Khởi tạo project trên Railway
```bash
railway init
railway up
```

### 3. Set environment variable
Trong Railway dashboard, thêm:
```
DATABASE_URL=file:./prisma/dev.db
```

### 4. Thêm Volume (persistent storage)
- Vào Railway dashboard → project → Add Volume
- Mount path: `/app/prisma`

### 5. Chạy migrate và seed lần đầu
```bash
railway run npx prisma migrate deploy
railway run npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

# Deploy lên Vercel (cần đổi database)

Vercel không hỗ trợ SQLite persistent. Cần dùng Turso (cloud SQLite):

### 1. Tạo tài khoản Turso: https://turso.tech
### 2. Tạo database và lấy URL + token
### 3. Cập nhật prisma/schema.prisma:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("TURSO_DATABASE_URL")
}
```
### 4. Set env vars trên Vercel:
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
