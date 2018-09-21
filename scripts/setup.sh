#!/usr/bin/env bash

# This init script will only setup, create, or run anything that it detects isn't
# already setup, created, or running
#
# Use setup.sh and run.sh to do a strict setup/run

echo $PWD

# Check for required programs

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


# Check for / install required npm modules

echo "Installing npm modules..."
npm install

# Import caches and other data

# if no orsm directory or the osrm data repo is not present
if ( ! [ -d "osrm" ] || [ -z "$(ls -p osrm | grep -v /)" ] ); then
    echo "Downloading osrm data..."
    mkdir osrm
    cd osrm
    # git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git
    curl -L -O https://github.com/cuappdev/ithaca-transit-backend/raw/tcat-map/map.osm
    cd ..
fi

# if no cache directory and the tcat data is not present
if ! ( [ -d "cache" ] && [ -e "cache/tcat-ny-us.zip" ] ); then
    echo "Downloading TCAT data..."
    mkdir cache
    cd cache
    wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
    cd ..
fi

# if no cache directory or the tcat data is not present
if ( ! [ -d "tcat-ny-us" ] || [ -z "$(ls -p tcat-ny-us | grep -v /)" ] ); then
    echo "Unzipping TCAT data..."
    mkdir tcat-ny-us
    unzip -o cache/tcat-ny-us.zip -d tcat-ny-us
fi


# Check for / clone required dependencies as git repos

# if no graphhopper directory or the repo is not already present
if ( ! [ -d "graphhopper" ] || [ -z "$(ls -p graphhopper | grep -v /)" ] ); then
    echo "Cloning graphhopper repository..."
    git clone --single-branch -b 0.10 https://github.com/graphhopper/graphhopper.git
fi

# if no map-matching directory or the repo is not present
if ( ! [ -d "map-matching" ] || [ -z "$(ls -p map-matching | grep -v /)" ] ); then
    echo "Cloning map matching repository..."
    git clone --single-branch -b 0.9 https://github.com/graphhopper/map-matching.git
fi

# if no graphhopper-walking directory or the repo is not present
if ( ! [ -d "graphhopper-walking" ] || [ -z "$(ls -p graphhopper-walking | grep -v /)" ] ); then
    echo "Cloning graphhopper-walking repository..."
    mkdir graphhopper-walking
    cd graphhopper-walking
    git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
    cd ..
fi


# Setup/build dependencies

# if no map-matching or the directory is empty
if ( ! [ -d "map-matching" ] || [ -z "$(ls -p map-matching | grep -v /)" ] ); then
    echo "Setting up map-matching repository..."
    cd map-matching
    ./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
    cd ..
fi

# if no graphhopper build target directory or the directory is empty
if ( ! [ -d "graphhopper/web/target" ]  || [ -z "$(ls -p graphhopper/web/target | grep -v /)" ] ); then
    echo "Building graphhopper service..."
    cd graphhopper
    ./graphhopper.sh buildweb
    cd ..
fi

# if no graphhopper-walking build target directory or the directory is empty
if ( ! [ -d "graphhopper-walking/graphhopper/web/target" ] || [ -z "$(ls -p graphhopper-walking/graphhopper/web/target | grep -v /)" ] ); then
    echo "Building graphhopper-walking service..."
    cd graphhopper-walking/graphhopper
    ./graphhopper.sh buildweb
    cd ../..
fi


# Run graph creation/update for graphhopper services

# if no graph-cache directory or the directory is empty
if ( ! [ -d "graph-cache" ] || [ -z "$(ls -p graph-cache | grep -v /)" ] ); then
    echo "Building graph cache..."
    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache &

    # wait until open
     until nc -G 30 -z localhost 8988; do
        echo "..."
        sleep 1
    done

    npm run cleanup
fi

# if no walking graph-cache directory or the directory is empty
if ( ! [ -d "graphhopper-walking/graph-cache" ] || [ -z "$(ls -p graphhopper-walking/graph-cache | grep -v /)" ] ); then
    echo "Building walking graph cache..."
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache &

    # wait until open
    until nc -G 30 -z localhost 8987; do
        echo "..."
        sleep 1
    done

    npm run cleanup
fi


# Start graphhopper service and finish

# if no graphhopper/java processing running
if ! [ $(ps aux | grep -E -c 'graphhopper|java') -gt 1 ]; then

    echo "Starting graphhopper..."

    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache & #&>/dev/null
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache & #&>/dev/null

    cd map-matching
    ./map-matching.sh action=start-server &>/dev/null &
    cd ..

    # wait until open
    until nc -G 30 -z localhost 8987 & nc -G 30 -z localhost 8988; do
        echo "..."
        sleep 1
    done

else

    echo "Graphhopper already running. "
    echo "Init complete!"

fi
