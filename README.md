# TCAT JavaScript API

## Getting Started

Before setup, download...

  - [node](https://nodejs.org/en/download/) (≥ v6.x.x)
  - [npm](https://www.npmjs.com/get-npm)

### AppDev JS

**Quick Way (Libraries)**

Install appdev.js dependencies with `npm install --save-dev babel-cli babel-jest babel-preset-flow flow-bin`

Within a generic "AppDev" folder (**not** within existing projects)

````
git clone https://github.com/cuappdev/appdev.js.git
cd appdev.js
npm install
npm run build
npm link # Links local NPM module in your global npm config
````

**Long Way**

Follow `JS` environment setup [`here`](https://github.com/cuappdev/bible/tree/master/js).

## Setup
Before setup, grab `node` version `6.*.*` and `npm`.  This is easily `Google`-ed.

Once you clone this repo, setup the following:
1. (Can be skipped if your `map.osm` is up to date)
Go to the following [`link`](http://www.openstreetmap.org/export#map=13/42.4510/-76.4967), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations.
Note this is only required to get a fresh `map.osm` file, in case roads and such have
been updated.
2. `npm install`
3. `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
4.

````bash
node_modules/osrm/lib/binding/osrm-extract osrm/map.osm -p node_modules/osrm/profiles/foot.lua
node_modules/osrm/lib/binding/osrm-contract osrm/map.osrm
mkdir osrm
mv *.osm* ./osrm
mv *.osrm* ./osrm
````

Note: When pasting multiple lines into terminal, every line will execute except the last one. Pressing Enter will execute the last line.

Full `OSRM Node API` docs can be found [`here`](https://github.com/Project-OSRM/osrm-backend/blob/HEAD/docs/nodejs/api.md)

## Regular Usage

1. Enter tcat.js/ folder
2. `npm start`
3. Use the base URL http://localhost:3000/api/v1
4. Test using the `/stops` endpoints (append "/stops" to above URL)

## Troubleshooting

In no particular order...

- `npm install webpack`
- `npm install`
- `npm link osrm`
- `npm link appdev`
- `npm start`
