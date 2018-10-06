#!/usr/bin/env bash

# grep -E -i ".*(\[main\]|\[INFO\]|erro?r?|exception|at.*(java|graphhopper)|exit*).*" # grep whitelist lines
# grep -E -i "^((?!download|points?|maven).)*$" # grep blacklist lines

cd docker-compose
echo "Initializing Graphhopper Services..."
docker-compose up --no-start --force-recreate ghopper # | grep -v -i 'points?0?\|download'
docker-compose up | rotatelogs -f -l  -n 5 ./logs/.graphhopper.log 86400 1M
cd ..
echo "Exiting"
