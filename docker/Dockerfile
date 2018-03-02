FROM node:carbon

RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/tcat.js.git /usr/src/app

WORKDIR /usr/src/app
RUN git checkout unstable

RUN apt-get update && apt-get -y install default-jre maven wget
RUN npm run setup
RUN npm run graph
