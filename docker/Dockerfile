FROM node:carbon

RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/tcat.js.git /usr/src/app

WORKDIR /usr/src/app
RUN git checkout young/docker

RUN apt-get update && apt-get -y install default-jdk default-jre maven wget
RUN npm run setup
RUN ./graphhopper/graphhopper.sh buildweb
RUN npm run cleanup
RUN npm run graph
RUN npm run mapmatching
RUN npm run start
