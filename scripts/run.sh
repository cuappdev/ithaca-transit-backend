#!/usr/bin/env bash

##############################################################################
#
# Docker Tasks:
# 1. Check for required programs
# 2. Install npm packages
# 3. Download OSRM data
# 4. Download GTFS from TCAT and unzip it
# 5. Clone graphhopper repositories (0.10) for walking, bus navigation, and map-matching
# 6. Build all graphhopper .jar files
# 7. Create/update graph cache for graphhopper services
# 8. Start graphhopper bus, map-matching, and walking services
#
# This script:
# 9. Assign CTRL+C to npm run stop
# 10. Check all services are running
# 12. Run docker-compose if not running then wait until initialized
# 13. Run Transit Backend
#
##############################################################################


usage()
{
    echo "Options:
    [-p | --prod] use Transit production mode (without running Transit in its own docker image/container)
    [-s | --setup] do not start Transit when finished
    [-h | --help] display these options"
}

OUT_COLOR="\033[1;34m" #blue
ERR_COLOR="\033[0;31m" #red
NC='\033[0m' # No Color
echo "${OUT_COLOR} --- Initializing Transit Backend --- ${NC}"
echo $PWD

PROD=false
RUN_TRANSIT=true

# parse args
while [ "$1" != "" ]; do
    case $1 in
        -h | --help )           usage
                                exit
                                ;;
        -p | --prod )           PROD=true
                                ;;
        -s | --setup )          RUN_TRANSIT=false
                                ;;
        * )                     usage
                                exit 1
    esac
    shift
done


# Graphhopper services

echo "${OUT_COLOR}Starting graphhopper docker containers...${NC}"

./scripts/run_ghopper.sh &

docker ps

# run Transit

if ${RUN_TRANSIT} ; then
    if ${PROD}; then
        echo "${OUT_COLOR}Starting Transit in production mode...${NC}"
        npm run start-prod
    else
        echo "${OUT_COLOR}Starting Transit in development mode...${NC}"
        npm run build-dev
    fi
fi
