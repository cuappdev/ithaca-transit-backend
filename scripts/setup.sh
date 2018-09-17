#!/usr/bin/env bash

# This init script will only setup, create, or run anything that it detects isn't
# already setup, created, or running
#
# Use setup.sh and run.sh to do a strict setup/run

if ! [ -x "$(command -v mvn)" ]; then
  echo 'Error: mvn (Maven) is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -x "$(command -v wget)" ]; then
  echo 'Error: wget is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -x "$(command -v java)" ]; then
  echo 'Error: java is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -x "$(command -v tar)" ]; then
  echo 'Error: tar is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -x "$(command -v git)" ]; then
  echo 'Error: git is not installed. Install then try again.' >&2
  exit 1
fi

if ! [ -e ".env" ]; then
    echo "Creating .env file..."
    cp env.template .env
fi

echo "Installing npm modules..."
npm install

if ! ( [ -d "graphhopper" ] && ! [ -x "$(git -C graphhopper rev-parse)" ] ); then
    echo "Cloning graphhopper repository..."
    git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
fi

if ! ( [ -d "map-matching" ] && ! [ -x "$(git -C map-matching rev-parse)" ] ); then
    echo "Cloning map matching repository..."
    git clone -b 0.9 https://github.com/graphhopper/map-matching.git
fi

if ! ( [ -d "graphhopper-walking" ] && ! [ -x "$(git -C graphhopper-walking rev-parse)" ] ); then
    echo "Cloning graphhopper-walking repository..."
    mkdir graphhopper-walking
    cd graphhopper-walking
    git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
    cd ..
fi

if ! [ -d "map-matching" ]; then
    echo "Setting up map-matching repository..."
    cd map-matching
    ./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
    cd ..
fi

if ! [ -e "tcat-ny-us.zip" ]; then
    echo "Downloading TCAT data..."
    wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
fi

if ! [ -d "tcat-ny-us" ]; then
    echo "Unzipping TCAT data..."
    mkdir tcat-ny-us
    tar xvf tcat-ny-us.zip -C tcat-ny-us
fi

if ! [ -d "graphhopper" ]; then
    echo "Building graphhopper service..."
    cd graphhopper
    ./graphhopper.sh buildweb
    cd ..
fi

if ! [ -d "graphhopper-walking/graphhopper" ]; then
    echo "Building graphhopper-walking service..."
    cd graphhopper-walking/graphhopper
    ./graphhopper.sh buildweb
    cd ../..
fi

if ! [ -d "graph-cache" ]; then
    echo "Building graph cache..."
    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache
    sleep 5s
fi

if ! [ -d "graphhopper-walking/graph-cache" ]; then
    echo "Building walking graph cache..."
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache
    sleep 5s
fi

if ! [ $(ps aux | grep -E -c 'graphhopper|java') -gt 1 ]; then

    echo "Starting graphhopper..."

    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache &>/dev/null &
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache &>/dev/null &

    cd map-matching
    ./map-matching.sh action=start-server &>/dev/null &
    cd ..

    sleep 3s

else

    echo "Init complete!"

fi