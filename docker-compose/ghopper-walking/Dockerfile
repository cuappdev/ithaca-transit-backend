FROM maven:3.6.0-jdk-8-alpine

RUN mkdir -p /usr/src/app
RUN apk add git

RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN git clone --single-branch -b 0.12 https://github.com/graphhopper/graphhopper.git

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh --action build

RUN mv ../map.osm .

COPY config.yml .

EXPOSE 8987

CMD java -Xmx1g -Xms1g -jar web/target/graphhopper-web-*.jar server config.yml
