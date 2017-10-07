#!/bin/bash

# makes a foot profile
node_modules/osrm/lib/binding/osrm-extract osrm/map.osm -p node_modules/osrm/profiles/foot.lua && \
node_modules/osrm/lib/binding/osrm-contract osrm/map.osrm && \
mkdir -p osrm/foot && \
mv osrm/map.osrm* osrm/foot/
# makes a car profile
node_modules/osrm/lib/binding/osrm-extract osrm/map.osm -p node_modules/osrm/profiles/car.lua && \
node_modules/osrm/lib/binding/osrm-contract osrm/map.osrm && \
mkdir -p osrm/car && \
mv osrm/map.osrm* osrm/car/
