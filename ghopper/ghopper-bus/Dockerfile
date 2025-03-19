FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install maven wget

RUN git clone --single-branch -b 0.13 https://github.com/graphhopper/graphhopper.git
RUN wget https://tcat-gtfs.s3.amazonaws.com/tcat-ny-us.zip

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh build

EXPOSE 8988

CMD java -Xmx8g -Xms8g \
  -Dgraphhopper.datareader.file=../map.osm \
  -Dgraphhopper.gtfs.file=../tcat-ny-us.zip \
  -Dgraphhopper.jetty.resourcebase=./graphhopper/web/src/main/webapp \
  -Dgraphhopper.graph.flag_encoders=pt \
  -Dgraphhopper.graph.bytes_for_flags=12 \
  -Dgraphhopper.prepare.ch.weightings=no \
  -Dgraphhopper.graph.location=./graph-cache \
  -Ddw.server.applicationConnectors[0].bindHost=0.0.0.0 \
  -Ddw.server.applicationConnectors[0].port=8988 \
  -jar web/target/graphhopper-web-0.13-SNAPSHOT.jar server config.yml
