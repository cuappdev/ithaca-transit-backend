FROM maven:3.6.0-jdk-8-alpine

RUN mkdir -p /usr/src/app
RUN apk add git wget

RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN git clone --single-branch -b 0.11 https://github.com/graphhopper/map-matching.git

WORKDIR /usr/src/app/map-matching

RUN mvn package -e -DskipTests
RUN java -jar matching-web/target/graphhopper-map-matching-web-0.11-SNAPSHOT.jar import ../map.osm --vehicle=car,foot

COPY config.yml .

EXPOSE 8989

CMD java -jar matching-web/target/graphhopper-map-matching-web-0.11-SNAPSHOT.jar server config.yml
