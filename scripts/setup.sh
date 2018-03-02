npm install
git clone https://github.com/graphhopper/graphhopper.git
git clone https://github.com/graphhopper/map-matching.git
cd map-matching
git checkout 0.9
./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
cd ..
mkdir tcat-ny-us
cd tcat-ny-us
wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
unzip tcat-ny-us.zip
