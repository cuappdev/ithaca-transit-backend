FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install maven wget

RUN git clone https://github.com/graphhopper/graphhopper.git
RUN wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh -a build

EXPOSE 8988

RUN ls web/target

CMD java -Xmx4g -Xms4g \
  -Ddw.graphhopper.datareader.file=../map.osm \
  -Ddw.graphhopper.gtfs.file=../tcat-ny-us.zip \
  -Ddw.graphhopper.jetty.resourcebase=./graphhopper/web/src/main/webapp \
  -Ddw.graphhopper.prepare.ch.weightings=no \
  -Ddw.graphhopper.graph.location=./graph-cache \
  -Ddw.server.application_connectors[0].bind_host=0.0.0.0 \
  -Ddw.server.application_connectors[0].port=8988 \
  -jar web/target/graphhopper-web-*-SNAPSHOT.jar server config.yml
