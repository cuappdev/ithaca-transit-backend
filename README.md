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

0. Clone this repo, on the same directory as tcat-ios.
1. Go to the following [`link`](http://www.openstreetmap.org/export#map=13/42.4510/-76.4967), and
click `Export` to grab the map of the Ithaca area to be used in routing calculations. After completing this once, only do againto update `map.osm` for updated map information.
2. Inside the `tcat.js` folder, run `npm install`
3. Run `brew install lua`, which is a dependency of [`OSRM`](http://project-osrm.org/),
the routing library that is used to aid routing calculations.
4. Run `npm link appdev`

Last but not least, copy and paste the following.

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

0. Enter tcat.js/ folder
1. `npm start`
2. Use the base URL http://localhost:3000/api/v1
3. Test using the `/stops` endpoints (append "/stops" to above URL)

## Troubleshooting

In no particular order...

- `npm install webpack`
- `npm install`
- `npm link osrm`
- `npm link appdev`
- `npm start`
