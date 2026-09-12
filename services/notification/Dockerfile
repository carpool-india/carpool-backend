FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY backend/shared ./shared
COPY backend/services/notification ./services/notification
RUN npm install --workspace=@rideshare/notification --workspace=@rideshare/types
WORKDIR /app/shared/types
RUN npx tsc -p tsconfig.json
WORKDIR /app/services/notification
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/services/notification/package.json ./services/notification/package.json
COPY --from=build /app/services/notification/dist ./services/notification/dist
WORKDIR /app/services/notification
EXPOSE 3005
CMD ["node", "dist/index.js"]
