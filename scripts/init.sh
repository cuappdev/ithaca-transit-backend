#!/usr/bin/env bash

if [[ $(ps aux | grep -E -c 'graphhopper|java') > 1 ]]; then

    echo "graphhopper already running"

else

    echo "starting graphhopper"

    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache &>/dev/null &
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache &>/dev/null &

    cd map-matching
    ./map-matching.sh action=start-server &>/dev/null &
    cd ..

    sleep 3s

fi