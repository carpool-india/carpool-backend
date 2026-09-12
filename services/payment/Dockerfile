FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY backend/shared ./shared
COPY backend/services/payment ./services/payment
RUN npm install --workspace=@rideshare/payment --workspace=@rideshare/types --workspace=@rideshare/utils
WORKDIR /app/shared/types
RUN npx tsc -p tsconfig.json
WORKDIR /app/shared/utils
RUN npx tsc -p tsconfig.json
WORKDIR /app/services/payment
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/services/payment/package.json ./services/payment/package.json
COPY --from=build /app/services/payment/dist ./services/payment/dist
WORKDIR /app/services/payment
EXPOSE 3003
CMD ["node", "dist/index.js"]
