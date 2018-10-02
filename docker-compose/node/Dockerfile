FROM node:10

RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app
RUN npm install

EXPOSE 3000
ENTRYPOINT npm start-prod

