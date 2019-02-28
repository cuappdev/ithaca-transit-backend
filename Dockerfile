# DEVELOPMENT
FROM node:10 AS development
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
ENV NODE_ENV development
EXPOSE 3000
CMD npm run start:dev

# PRODUCTION
FROM node:10.15-alpine AS release
WORKDIR /usr/src/app
COPY . .
COPY --from=development /usr/src/app/node_modules /usr/src/app/node_modules
ENV NODE_ENV production
RUN npm run build:prod
EXPOSE 3000
CMD npm run serve
