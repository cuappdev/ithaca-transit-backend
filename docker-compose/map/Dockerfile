FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN git clone --single-branch -b 0.9 https://github.com/graphhopper/map-matching.git

WORKDIR /usr/src/app/map-matching

RUN apt-get update
RUN apt-get -y install maven wget
RUN ./map-matching.sh action=import datasource=../map.osm vehicle=car,foot

EXPOSE 8989

CMD ./map-matching.sh action=start-server
