# Ithaca Transit Backend
<img width="256" alt="Ithaca Transit App Icon" src="https://raw.githubusercontent.com/cuappdev/tcat-ios/master/app-icon.png">

Ithaca Transit is a new end-to-end navigation service built for the TCAT bus service in Ithaca.

Download on the App Store [here](https://itunes.apple.com/app/id1290883721)!

## Setup

Please ensure `npm` ([npm](https://www.npmjs.com/get-npm)) and `docker` ([docker](https://www.docker.com/)) are installed by checking `npm -v` and `docker -v` and that Docker is running.

## Environment Variables
It's recommended to use [`direnv`](https://direnv.net).
The required environment variables for this API are the following:

To use `direnv` with this repository, run the following and then set the variables appropriately.

```bash
cp envrc.template .envrc
cp python.envrc.template python.envrc
```
Environment variable values can be found by asking a member of Cornell AppDev.


## Run

`package.json` contains all necessary run, build, test, and utility scripts for the project. **Type `npm run` before a script name to execute.** `npm run` by itself shows a list of available scripts.

#### Development

To run ithaca-transit-backend locally, run the following:

```bash
npm run build:dev
npm run start:microservices
npm run start:node
```

* `build:dev` builds node and `start:microservices` starts up its microservices.

* `start:node` runs node inside a docker image; substitute `start:dev` to run on your local computer.

    * You can see in package.json that when you run `npm run start:node`, it actually runs `docker-compose up node`. On the other hand, the command for starting development is `npm run start:dev`; in package.json, its value tells us to actually execute some magic (./node_modules/.bin/webpack…).

You only need to run `npm run build:dev` and `npm run start:microservices` once - the "volumes" part of docker-compose.yml allows for hot reloading. However, if you are building an image for production, make sure to do `npm run build:dev` right before doing that. And you will always need to run `start` to run node.

To stop running the microservices:

```
docker-compose down
```
