# TCAT Backend

This is our implementation of the TCAT backend. It is currently being rebuilt on top of the GraphHopper API.

## Pre-Req

Check if you have Maven installed with `mvn -v`. If you don't, `brew install maven`.

## Install

Run `npm run setup` to setup all the necessary data. If you get an error about wget, `brew install wget`.

## Running

Run `npm run graph` to build the graph. It starts up the GraphHopper server, which builds the graph if a cache doesn't exist already. After the server has fully started and the graph is built, **kill the session using `Ctrl-C`**.
 
Run `npm start` to startup the backend at `localhost:3000`.

You can run `npm run cleanup` to kill any GraphHopper processes. This is useful in case the GraphHopper server cannot be started if the port (default 8989) is already bound.

### Supported requests

Currently, it supports the following requests.

* GET /route - get a route from the GraphHopper API
    * start - latitude longitude pair (comma delimited)   
    * end - latitude longitude pair (comma delimited)
    * time - departure time formatted as [ISO 8601](https://en.wikipedia.org/wiki/Unix_time) (see link for Unix time and equivalent format)

