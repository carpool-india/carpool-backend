FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/booking ./services/booking
RUN npm install --workspace=@rideshare/booking --workspace=@rideshare/types --workspace=@rideshare/utils
WORKDIR /app/shared/types
RUN npx tsc -p tsconfig.json
WORKDIR /app/shared/utils
RUN npx tsc -p tsconfig.json
WORKDIR /app/services/booking
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/services/booking/package.json ./services/booking/package.json
COPY --from=build /app/services/booking/dist ./services/booking/dist
WORKDIR /app/services/booking
EXPOSE 3002
CMD ["node", "dist/index.js"]
