# TCAT JavaScript API

## Getting Started

Before setup, download...

  - [node](https://nodejs.org/en/download/) (≥ `v6.x.x`)
  - [npm](https://www.npmjs.com/get-npm) (`v4.x.x`, `5.x.x` doesn't work)

## Setup

Once you clone this repo, setup the following:
1. `npm install`
2. `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
3. `./setup.sh`

## Regular Usage

1. Enter tcat.js/ folder
2. `npm start`
3. Use the base URL `http://localhost:3000/api/v1`
4. Test using the `/stops` endpoints (append "/stops" to above URL)

## Troubleshooting

In no particular order...

- `npm install webpack`
- `npm install`
- `npm link osrm`
- `npm link appdev`
- `npm start`

## Updating the Map

Go to the following [`link`](http://www.openstreetmap.org/export#map=13/42.4510/-76.4967), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations.
Note this is only required to get a fresh `map.osm` file, in case roads and such have
been updated.

## OSRM Info

Full `OSRM Node API` docs can be found [`here`](https://github.com/Project-OSRM/osrm-backend/blob/HEAD/docs/nodejs/api.md)
