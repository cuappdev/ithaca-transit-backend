FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install maven wget

RUN git clone --single-branch -b 0.10 https://github.com/graphhopper/graphhopper.git

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh buildweb

WORKDIR /usr/src/app

EXPOSE 8987

CMD java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=./graph-cache
