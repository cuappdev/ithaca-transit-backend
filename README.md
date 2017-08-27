# TCAT JavaScript API

## Setup

0. Clone this repo, then follow the instuctions within that repo.
1. Go to the following [`link`](http://www.openstreetmap.org/export#map=13/42.4510/-76.4967), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations.
Note this is only required to get a fresh `map.osm` file, in case roads and such have
been updated.
2. `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
3. Build `osrm` library from source for `node` and `link` it (explained [`here`](https://github.com/Project-OSRM/osrm-backend/issues/4432#issuecomment-324790814))
4.
````bash
npm install
node_modules/osrm/lib/binding/osrm-extract osrm/map.osm -p node_modules/osrm/profiles/foot.lua
node_modules/osrm/lib/binding/osrm-contract osrm/map.osrm
mkdir osrm
mv *.osm* ./osrm
mv *.osrm* ./osrm
npm start
````

Full `OSRM Node API` docs can be found [`here`](https://github.com/Project-OSRM/osrm-backend/blob/HEAD/docs/nodejs/api.md)
