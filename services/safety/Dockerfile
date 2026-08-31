FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/safety ./services/safety
RUN npm install --workspace=@rideshare/safety --workspace=@rideshare/types --workspace=@rideshare/utils
WORKDIR /app/shared/types
RUN npx tsc -p tsconfig.json
WORKDIR /app/shared/utils
RUN npx tsc -p tsconfig.json
WORKDIR /app/services/safety
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/services/safety/package.json ./services/safety/package.json
COPY --from=build /app/services/safety/dist ./services/safety/dist
WORKDIR /app/services/safety
EXPOSE 3006
CMD ["node", "dist/index.js"]
