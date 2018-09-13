#!/usr/bin/env bash
npm install
git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
git clone -b 0.9 https://github.com/graphhopper/map-matching.git

mkdir graphhopper-walking
cd graphhopper-walking
git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
cd ..

cd map-matching
./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
cd ..

wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip

mkdir tcat-ny-us
tar xvf tcat-ny-us.zip -C tcat-ny-us

cd graphhopper
./graphhopper.sh buildweb
cd ..

cd graphhopper-walking/graphhopper
./graphhopper.sh buildweb
cd ../..

