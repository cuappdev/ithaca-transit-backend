#!/usr/bin/env bash

# grep -E -i ".*(\[main\]|\[INFO\]|erro?r?|exception|at.*(java|graphhopper)|exit*).*" # grep whitelist lines
# grep -E -i "^((?!download|points?|maven).)*$" # grep blacklist lines

echo "Initializing Graphhopper Services..."
docker-compose -f docker-compose/docker-compose.yml up --no-start --force-recreate ghopper # | grep -v -i 'points?0?\|download'
docker-compose -f docker-compose/docker-compose.yml up | rotatelogs -f -l  -n 5 ./logs/.graphhopper.log 86400 1M
echo "Graphhopper Services Stopped."
