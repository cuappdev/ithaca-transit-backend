# TCAT JavaScript API

## Setup

1. Go to the following [`link`](http://www.openstreetmap.org/relation/174979), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations.
Note this is only required to get a fresh `map.osm` file, in case roads and such have
been updated.
2. `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
3.
````bash
npm install
node_modules/osrm/lib/binding/osrm-extract map.osm -p node_modules/osrm/profiles/car.lua
node_modules/osrm/lib/binding/osrm-contract map.osrm
mkdir osrm
mv *.osm* ./osrm
mv *.osrm* ./osrm
npm start
````
4. Scrape TCAT data via `tcat-scrape` repo and move the `data` folder to the root of this directory.

Full `OSRM Node API` docs can be found [`here`](https://github.com/Project-OSRM/osrm-backend/blob/HEAD/docs/nodejs/api.md)
