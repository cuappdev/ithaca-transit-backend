#!/usr/bin/env bash

# This init script will only setup, create, or run anything that it detects isn"t
# already setup, created, or running
#
# Use setup.sh and run.sh to do a strict setup/run

OUT_COLOR="\033[1;34m" #blue
ERR_COLOR="\033[0;31m" #red
NC='\033[0m' # No Color
echo "${OUT_COLOR} --- Initializing Transit Backend --- ${NC}"
echo $PWD

# Check for required programs

if ! [ -x "$(command -v mvn)" ]; then
  echo "${ERR_COLOR}Error: mvn (Maven) is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -x "$(command -v wget)" ]; then
  echo "${ERR_COLOR}Error: wget is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo "${ERR_COLOR}Error: npm is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -x "$(command -v java)" ]; then
  echo "${ERR_COLOR}Error: java is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -x "$(command -v tar)" ]; then
  echo "${ERR_COLOR}Error: tar is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -x "$(command -v git)" ]; then
  echo "${ERR_COLOR}Error: git is not installed. Install then try again." >&2
  exit 1
fi

if ! [ -e ".env" ]; then
    echo "${OUT_COLOR}Creating .env file...${NC}"
    cp env.template .env
fi


# Check for / install required npm modules

echo "${OUT_COLOR}Installing npm modules...${NC}"
npm install

# Import caches and other data

# if no orsm directory or the osrm data repo is not present
if ( ! [ -d "osrm" ] || [ -z "$(ls -p osrm | grep -v /)" ] ); then
    echo "${OUT_COLOR}Downloading osrm data...${NC}"
    mkdir osrm
    cd osrm
    # git clone --single-branch -b tcat-map https://github.com/cuappdev/ithaca-transit-backend.git
    curl -L -O https://github.com/cuappdev/ithaca-transit-backend/raw/tcat-map/map.osm
    cd ..
fi

# if no cache directory and the tcat data is not present
if ! ( [ -d "cache" ] && [ -e "cache/tcat-ny-us.zip" ] ); then
    echo "${OUT_COLOR}Downloading TCAT data...${NC}"
    mkdir cache
    cd cache
    wget https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip
    cd ..
fi

# if no cache directory or the tcat data is not present
if ( ! [ -d "tcat-ny-us" ] || [ -z "$(ls -p tcat-ny-us | grep -v /)" ] ); then
    echo "${OUT_COLOR}Unzipping TCAT data...${NC}"
    mkdir tcat-ny-us
    unzip -o cache/tcat-ny-us.zip -d tcat-ny-us
fi


# Check for / clone required dependencies as git repos

# if no graphhopper directory or the repo is not already present
if ( ! [ -d "graphhopper" ] || [ -z "$(ls -p graphhopper | grep -v /)" ] ); then
    echo "${OUT_COLOR}Cloning graphhopper repository...${NC}"
    git clone --single-branch -b 0.10 https://github.com/graphhopper/graphhopper.git
fi

# if no map-matching directory or the repo is not present
if ( ! [ -d "map-matching" ] || [ -z "$(ls -p map-matching | grep -v /)" ] ); then
    echo "${OUT_COLOR}Cloning map matching repository...${NC}"
    git clone --single-branch -b 0.9 https://github.com/graphhopper/map-matching.git
fi

# if no graphhopper-walking/graphhopper directory or the repo is not present
if ( ! [ -d "graphhopper-walking" ] || ! [ -d "graphhopper-walking/graphhopper" ] || [ -z "$(ls -p graphhopper-walking/graphhopper | grep -v /)" ]); then
    echo "${OUT_COLOR}Cloning graphhopper-walking repository...${NC}"
    mkdir graphhopper-walking
    cd graphhopper-walking
    git clone -b 0.10 https://github.com/graphhopper/graphhopper.git
    cd ..
fi


# Setup/build dependencies

# if no map-matching or the directory is empty
if ( ! [ -d "map-matching" ] || [ -z "$(ls -p map-matching | grep -v /)" ] ); then
    echo "${OUT_COLOR}Setting up map-matching repository...${NC}"
    cd map-matching
    ./map-matching.sh action=import datasource=../osrm/map.osm vehicle=car,foot
    cd ..
fi

# if no graphhopper build target directory or the directory is empty
if ( ! [ -d "graphhopper/web/target" ]  || [ -z "$(ls -p graphhopper/web/target | grep -v /)" ] ); then
    echo "${OUT_COLOR}Building graphhopper service...${NC}"
    cd graphhopper
    ./graphhopper.sh buildweb
    cd ..
fi

# if no graphhopper-walking build target directory or the directory is empty
if ( ! [ -d "graphhopper-walking/graphhopper/web/target" ] || [ -z "$(ls -p graphhopper-walking/graphhopper/web/target | grep -v /)" ] ); then
    echo "${OUT_COLOR}Building graphhopper-walking service...${NC}"
    cd graphhopper-walking/graphhopper
    ./graphhopper.sh buildweb
    cd ../..
fi


# Run graph creation/update for graphhopper services

# if no graph-cache directory or the directory is empty
if ( ! [ -d "graph-cache" ] || [ -z "$(ls -p graph-cache | grep -v /)" ] ); then
    echo "${OUT_COLOR}Building graph cache...${NC}"
    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache &

    # wait until open
    until bash -c "echo > /dev/tcp/localhost/8988" &>/dev/null; do
        echo "${OUT_COLOR}...${NC}"
        sleep 1
    done

    ls graph-cache

    npm run cleanup
fi

# if no walking graph-cache directory or the directory is empty
if ( ! [ -d "graphhopper-walking/graph-cache" ] || [ -z "$(ls -p graphhopper-walking/graph-cache | grep -v /)" ] ); then
    echo "${OUT_COLOR}Building walking graph cache...${NC}"
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache &

    # wait until open
    until bash -c "echo > /dev/tcp/localhost/8987" &>/dev/null; do
        echo "${OUT_COLOR}...${NC}"
        sleep 1
    done

    ls graphhopper-walking/graph-cache

    npm run cleanup
fi


# Start graphhopper service and finish

# if no graphhopper/java processing running
if ! [ $(ps aux | grep -c 'graphhopper') -gt 1 ]; then

    echo "${OUT_COLOR}Starting graphhopper...${NC}"

    java -Xmx1g -Xms1g -jar graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm gtfs.file=tcat-ny-us.zip jetty.port=8988 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=pt prepare.ch.weightings=no graph.location=./graph-cache & #&>/dev/null
    java -Xmx1g -Xms1g -jar graphhopper-walking/graphhopper/web/target/graphhopper-web-*-with-dep.jar datareader.file=osrm/map.osm jetty.port=8987 jetty.resourcebase=./graphhopper/web/src/main/webapp graph.flag_encoders=foot prepare.ch.weightings=no graph.location=graphhopper-walking/graph-cache & #&>/dev/null

    cd map-matching
    ./map-matching.sh action=start-server &>/dev/null &
    cd ..

    # wait until open
    until bash -c "echo > /dev/tcp/localhost/8987" &>/dev/null & bash -c "echo > /dev/tcp/localhost/8988" &>/dev/null; do
        sleep 1
        echo "${OUT_COLOR}...${NC}"
    done

    ps aux | grep 'graphhopper'

else

    echo "${OUT_COLOR}Graphhopper already running. "
    echo "${OUT_COLOR}Init complete!${NC}"

fi