FROM node:10

#ARG RELEASE_COMPARE_COMMIT
#ARG commit
ARG RELEASE_COMMIT
RUN echo ${RELEASE_COMMIT}
RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN git checkout ${RELEASE_COMMIT} .
RUN npm install

COPY .env /usr/src/app/.env
COPY tcat-ny-us /usr/src/app/tcat-ny-us
RUN ls

ENTRYPOINT npm run start-prod
