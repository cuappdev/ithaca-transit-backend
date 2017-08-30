# TCAT JavaScript API

## Setup
Before setup, grab `node` version `6.*.*` and `npm`.  This is easily `Google`-ed.
Also follow `JS` environment setup [`here`](https://github.com/cuappdev/bible/tree/master/js),
**including the library section**, as the `appdev` module is necessary for this app.

Once you clone this repo, setup the following:
1. (Can be skipped if your `map.osm` is up to date)
Go to the following [`link`](http://www.openstreetmap.org/export#map=13/42.4510/-76.4967), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations.
Note this is only required to get a fresh `map.osm` file, in case roads and such have
been updated.
2. `npm install`
3. `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
4. Build `osrm` library from source for `node` and `link`. Run commands below.

````bash
git clone https://github.com/Project-OSRM/osrm-backend.git
cd osrm-backend
mkdir build
cd build
cmake -DENABLE_MASON=ON -DENABLE_NODE_BINDINGS=ON ..
make
cd ..
npm link
````

5. `npm link appdev`
6. Then, inside tcat.js folder, run `npm link osrm`

````bash
node_modules/osrm/lib/binding/osrm-extract osrm/map.osm -p node_modules/osrm/profiles/foot.lua
node_modules/osrm/lib/binding/osrm-contract osrm/map.osrm
mkdir osrm
mv *.osm* ./osrm
mv *.osrm* ./osrm
````

Full `OSRM Node API` docs can be found [`here`](https://github.com/Project-OSRM/osrm-backend/blob/HEAD/docs/nodejs/api.md)

## Regular Usage

0. Enter tcat.js/ folder
1. `npm start`
2. Use the base URL http://localhost:3000/api/v1
