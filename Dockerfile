FROM node:10

WORKDIR /usr/src/app

COPY package.json .
RUN npm install
RUN ls

COPY . .
ENV NODE_ENV production

RUN npm run build

EXPOSE 3000
CMD npm run serve
