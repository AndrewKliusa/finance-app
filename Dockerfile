FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/main.ts ./main.ts
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/handlers ./handlers
COPY --from=build /app/lib ./lib
COPY --from=build /app/preHandlers ./preHandlers
COPY --from=build /app/routes ./routes
COPY --from=build /app/schemas ./schemas
COPY --from=build /app/services ./services
COPY --from=build /app/types ./types
COPY --from=build /app/workers ./workers

EXPOSE 3000
CMD ["npm", "run", "start"]
