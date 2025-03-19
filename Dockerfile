FROM node:22.0.0
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install --force
CMD npm run start
