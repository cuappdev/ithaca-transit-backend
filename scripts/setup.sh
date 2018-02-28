npm install
git clone https://github.com/graphhopper/graphhopper.git
git clone https://github.com/graphhopper/map-matching.git
cd map-matching
git checkout 0.9
<<<<<<< HEAD
./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
cd ..
wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
mkdir tcat-ny-us
tar xvf tcat-ny-us.zip -C tcat-ny-us
=======
./map-matching.sh action=import datasource=../osrm/tcat.osm.pbf vehicle=car,foot
cd ..
wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
>>>>>>> a7af952be41912217a052f784fc4b363305b94f9
cd graphhopper
./graphhopper.sh buildweb
cd ..
