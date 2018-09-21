FROM openjdk:8

RUN mkdir /usr/src/app
RUN git clone -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git /usr/src/app

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get -y install maven wget

RUN git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
RUN wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip

WORKDIR /usr/src/app/graphhopper
RUN ./graphhopper.sh buildweb

WORKDIR /usr/src/app

EXPOSE 8988

CMD java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache
