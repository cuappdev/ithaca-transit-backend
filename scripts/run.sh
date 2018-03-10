java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt,foot prepare.ch.weightings=no graph.location=./graph-cache &>/dev/null &

cd map-matching
./map-matching.sh action=start-server &>/dev/null &
cd ..

sleep 3s
npm run serve

