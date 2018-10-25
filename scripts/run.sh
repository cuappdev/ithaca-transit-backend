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
    [-p | --prod]
        Run Graphhopper and use Transit production mode.
        Alias (same as in CLI): npm run serve
        Features:
            - optimized builds
            - remote logging
            - no console output

    [-d | --dev]
        Run Graphhopper and use Transit development mode.
        Alias (same as in CLI): npm run build-dev
        Features:
            - fast builds
            - hot reload
            - no remote logging
            - verbose console output
            - automatic restart/testing on file change
            - simulator integration middleware
            - current release response comparison middleware
        DO NOT USE DEVELOPMENT MODE IN DEPLOYMENT/DEPLOYMENT!!!!!!

    [-t | --test]
        Run Graphhopper and use Transit test mode.
        Alias (same as npm command in CLI): npm run test-dev
        Features:
            - production mode testing
            - test once with minimal output then quit

    [-s | --setup]
        Run Graphhopper and initialization tasks but do not start Transit.

    [-h | --help]
        Display these options."
}

OUT_COLOR="\033[1;34m" #blue
ERR_COLOR="\033[0;31m" #red
NC='\033[0m' # No Color
echo "${OUT_COLOR} --- Initializing Transit Backend --- ${NC}"
echo $PWD

PROD=false
DEV=false
TEST=false
RUN_TRANSIT=true

# parse args
while [ "$1" != "" ]; do
    case $1 in
        -h | --help )           usage
                                exit
                                ;;
        -p | --prod )           PROD=true
                                ;;
        -d | --dev )            DEV=true
                                ;;
        -t | --test )           TEST=true
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
        npm run serve
    elif ${DEV}; then
        echo "${OUT_COLOR}Starting Transit in development mode...${NC}"
        npm run build-dev
    elif ${TEST}; then
        echo "${OUT_COLOR}Starting Transit in test mode...${NC}"
        npm run test-dev
    else
        npm run init
    fi
else
    npm run init
fi
