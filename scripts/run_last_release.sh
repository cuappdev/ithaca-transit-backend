#!/usr/bin/env bash

read_var() {
    VAR=$(grep $1 $2 | xargs)
    IFS="=" read -ra VAR <<< "$VAR"
    echo ${VAR[1]}
}

echo "Setup last-release .env ..."
cp .env docker-last-release/.env
cp -r tcat-ny-us docker-last-release/last-release
source .env
echo "Last release on port ${RELEASE_PORT}"
echo "At commit ${RELEASE_COMMIT}"
echo "Running Ithaca Transit Backend release at specified commit for output comparison..."
cd docker-last-release
docker-compose up | rotatelogs -f -l  -n 5 ./logs/.graphhopper.log 86400 1M
cd ..

# docker-compose up --no-start --force-recreate ghopper # | grep -v -i 'points?0?\|download'
# docker-compose up | rotatelogs -f -l  -n 5 ./logs/.graphhopper.log 86400 1M
# cd ..
echo "Exiting compare release process"
