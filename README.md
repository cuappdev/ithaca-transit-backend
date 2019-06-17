# Ithaca Transit Backend
<img width="256" alt="Ithaca Transit App Icon" src="https://raw.githubusercontent.com/cuappdev/tcat-ios/master/app-icon.png">

Ithaca Transit is a new end-to-end navigation service built for the TCAT bus service in Ithaca.

Download on the App Store [here](https://itunes.apple.com/app/id1290883721)!

## Setup

Please ensure `npm` ([npm](https://www.npmjs.com/get-npm)) and `docker` ([docker](https://www.docker.com/)) are installed by checking `npm -v` and `docker -v` and that Docker is running.


Run the following:

```
cp env.template .env
cp python.env.template python.env
```

Environment variable values can be found by asking a member of Cornell AppDev.

## Run

`package.json` contains all necessary run, build, test, and utility scripts for the project. **Type `npm run` before a script name to execute.** `npm run` by itself shows a list of available scripts.

#### Development

Run the following:

```
npm run build:dev
npm run start:microservices
npm run start:node
```

To stop running the microservices:

```
docker-compose down
```
