FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/tcat.js.git /usr/src/app

WORKDIR /usr/src/app
RUN git checkout austin/realtime
RUN apt-get update

RUN apt-get -y install maven wget
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs 
RUN npm run setup

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh buildweb

WORKDIR /usr/src/app
RUN cp tcat-ny-us/tcat-ny-us.zip .

EXPOSE 3000
EXPOSE 8988
EXPOSE 8989
CMD [ "npm", "run", "start" ]
