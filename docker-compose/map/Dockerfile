FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone https://github.com/cuappdev/tcat-map.git /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update

RUN apt-get -y install maven wget
RUN git clone https://github.com/graphhopper/map-matching.git

WORKDIR /usr/src/app/map-matching

RUN git checkout 0.9
RUN ./map-matching.sh action=import datasource=../map.osm vehicle=car,foot

WORKDIR /usr/src/app

WORKDIR /usr/src/app/map-matching

EXPOSE 8989

CMD ./map-matching.sh action=start-server
