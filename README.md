# TCAT Backend

This is our implementation of the TCAT backend. It is currently being rebuilt on top of the GraphHopper API.

## Pre-Req

Check if you have Maven installed with `mvn -v`. If you don't, `brew install maven`.

After cloning the repo, run `cp env.template .env`. This will copy env.template to .env which will allow you to run the server on port 3000. You need to do `vim .env` and add the value for `TOKEN`, which you can find pinned in #tcat-backend. You cannot run the server on port 80. When doing testing locally, you must use port 3000.

## Install
Run `npm run setup` and `npm i` to setup all the necessary data. If you get an error about wget, `brew install wget`.

## Running

Upon completion, each of the steps will include the line `[main] INFO  com.graphhopper.xxxxxxxxxxxxxxxx - Started server at HTTP :8988`

If at any of these points you get an exception along the lines of
````
Exception in thread "main" java.net.BindException: Address already in use
````
Run `npm run cleanup` to kill any GraphHopper processes. This is useful in case the GraphHopper server cannot be started if the port (default 8989) is already bound.

1. Run `npm run graph` to build the graph. It starts up the GraphHopper Routing server, which builds the graph if a cache doesn't exist already. After the server has fully started and the graph is built, **kill the session using `Ctrl-C`**.

2. Run `npm run mapmatching` to build the map matching graph (snapping to the road). It starts up the GraphHopper Map Matching server, which builds the graph for map matching if a cache doesn't exist already. After the server has fully started and the graph is built, **kill the session using `Ctrl-C`**.
 
Run `npm start` to startup the backend at `localhost:3000`.

### Supported requests

Currently, it supports the following requests.

* GET /route - get a route from the GraphHopper API
    * start - latitude longitude pair (comma delimited)   
    * end - latitude longitude pair (comma delimited)
    * time - departure time formatted as [ISO 8601](https://en.wikipedia.org/wiki/Unix_time) (see link for Unix time and equivalent format)

