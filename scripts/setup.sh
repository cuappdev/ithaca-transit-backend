npm install
git clone https://github.com/graphhopper/graphhopper.git
git clone https://github.com/graphhopper/map-matching.git
cd map-matching
git checkout 0.9
./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car
cd ..
wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
cd graphhopper
./graphhopper.sh buildweb
cd ..
