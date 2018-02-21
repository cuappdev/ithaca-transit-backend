# TCAT Backend

This is our implementation of the TCAT backend. It is currently being rebuilt on top of the GraphHopper API.

## Install

Run `sh scripts/setup.sh` to setup all the necessary data

## Running

Run `npm start` to startup the backend at `localhost:3000`.

You can run `sh scripts/cleanup` to kill any remaining processes.

### Supported requests

Currently, it supports the following requests.

* GET /route - get a route from the GraphHopper API
    * start - latitude longitude pair (comma delimited)   
    * end - latitude longitude pair (comma delimited)
    * time - departure time formatted as [ISO 8601](https://en.wikipedia.org/wiki/Unix_time) (see link for Unix time and equivalent format)

