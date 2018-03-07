npm install
git clone https://github.com/graphhopper/graphhopper.git
git clone https://github.com/graphhopper/map-matching.git
cd graphhopper
git checkout 0.10
cd ..
cd map-matching
git checkout 0.9
./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
cd ..
wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
mkdir tcat-ny-us
tar xvf tcat-ny-us.zip -C tcat-ny-us
cd graphhopper
./graphhopper.sh buildweb
cd ..
