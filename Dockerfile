# ===== Frontend: Next.js 16 (React 19, TypeScript, Tailwind 4) =====

# --- Giai đoạn 1: cài thư viện (tận dụng cache khi package*.json không đổi) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Giai đoạn 2: build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Biến NEXT_PUBLIC_* được "in cứng" vào JS lúc build,
# nên phải truyền qua ARG (docker-compose.yml -> build.args), đặt lúc chạy là vô tác dụng.
ARG NEXT_PUBLIC_USE_MOCK_API=false
ARG NEXT_PUBLIC_API_BASE_URL=https://hloi0408.click
ENV NEXT_PUBLIC_USE_MOCK_API=$NEXT_PUBLIC_USE_MOCK_API \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Giai đoạn 3: chạy thật ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Chỉ lấy thứ cần để chạy, và chạy bằng user "node" (không dùng root)
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 3000

# Gọi thẳng next (không qua npm) để container nhận tín hiệu dừng đúng cách
CMD ["node_modules/.bin/next", "start"]
