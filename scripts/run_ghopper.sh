#!/usr/bin/env bash

# grep -E -i ".*(\[main\]|\[INFO\]|erro?r?|exception|at.*(java|graphhopper)|exit*).*" # grep whitelist lines
# grep -E -i "^((?!download|points?|maven).)*$" # grep blacklist lines

cd docker-compose
docker-compose up --no-start --force-recreate ghopper # | grep -v -i 'points?0?\|download'
docker-compose up | rotatelogs -f -l .graphhopper.log 604800 1M
cd ..
echo "Exiting"
