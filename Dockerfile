FROM node:20.0.0
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
RUN npm install --force
CMD npm run start
#CMD /bin/sh
