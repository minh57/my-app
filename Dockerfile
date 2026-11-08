# --- GIAI ĐOẠN 1: Cài đặt thư viện ---
FROM node:20-alpine AS deps
WORKDIR /app
# Chỉ copy 2 file cấu hình thư viện để tận dụng bộ nhớ đệm (cache) của Docker
COPY package.json package-lock.json ./
# Cài đặt các thư viện cần thiết
RUN npm ci

# --- GIAI ĐOẠN 2: Build dự án ---
FROM node:20-alpine AS builder
WORKDIR /app
# Copy thư viện đã cài ở Giai đoạn 1 sang
COPY --from=deps /app/node_modules ./node_modules
# Copy toàn bộ code của dự án
COPY . .
# Tắt tính năng gửi thông tin (telemetry) của Next.js cho nhẹ
ENV NEXT_TELEMETRY_DISABLED 1
# Chạy lệnh build để tạo ra sản phẩm cuối cùng (thư mục .next)
RUN npm run build

# --- GIAI ĐOẠN 3: Môi trường chạy thực tế ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# CHỈ LẤY những file cần thiết từ Giai đoạn 2 để chạy, bỏ đi toàn bộ code thừa
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Lệnh khởi chạy
CMD ["npm", "start"]
