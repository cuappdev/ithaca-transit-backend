# Ithaca Transit Backend

## Pre-Req

Check if you have Maven installed with `mvn -v`. If you don't, `brew install maven`.

After cloning the repo and entering the directory, run `cp env.template .env`. This will copy env.template to .env which will allow you to run the server on port 3000. You need to do `vim .env` and add the correct value for `TOKEN`, which you can find pinned in the #transit-backend Slack channel. You cannot run the server on port 80. When doing testing locally, you must use port 3000.

## Install
Run `npm run setup` and `npm i` to setup all the necessary data. 

If the install lags for an especially long time (> 30 min), kill the process (Ctrl-C) and retry. If you get an error about wget, use `brew install wget`. If you need npm (we won't judge), go [here](https://www.npmjs.com/get-npm).

## Running

Upon completion, each of the steps will include the line `[main] INFO  com.graphhopper.xxxxxxxxxxxxxxxx - Started server at HTTP :8988`. If you don't see this, see below for handling errors.

1. Run `npm run graph` to build the graph. It starts up the GraphHopper Routing server, which builds the graph if a cache doesn't exist already. After the server has fully started and the graph is built, **kill the session using `Ctrl-C`**.

2. Run `npm run mapmatching` to build the map matching graph (snapping to the road). It starts up the GraphHopper Map Matching server, which builds the graph for map matching if a cache doesn't exist already. After the server has fully started and the graph is built, **kill the session using `Ctrl-C`**.
 
### Run Configurations
 
* `npm start` runs cleanup, builds, and starts the program in production mode at `localhost:3000`. In production mode, all errors will be logged remotely to register, build times are much longer, and tests are not automatically run, so don't use this locally.

* `npm run start-dev` runs the program in development mode. Use this while developing. Development mode will automatically build, restart the server, and run tests whenever a file is changed, so there should be no need to use Postman or other programs to test endpoints. 
Development mode also has faster build times and outputs errors and debugging information to the console.

* `npm test` starts the program in test mode and runs tests once on any existing bundle in `build/`. It will not automatically start graphhopper or rebuild the bundle.

### Errors

If at any of these points you get an exception along the lines of
````
Exception in thread "main" java.net.BindException: Address already in use
````
Run `npm run cleanup` to kill any GraphHopper processes. This is useful in case the GraphHopper server cannot be started if the port (default 8989) is already bound.


# Transit API v1 REST Interface

# Endpoints

**Base URL: example.your.url**
**Path:** <Base URL>/api/v1/<endpoint>


----------
# **/alerts** • GET

**Description:** Return a list of official TCAT alerts/messages. A list should be included in the app, and periodically updated every so often. All fields are optional. 
The date, time, and daysOfWeek fields can specify an alert that takes place for example from 10 pm March 4 (fromDate) to 12 pm April 10 (toDate) on Weekdays (daysOfWeek) from 1 pm (fromTime) to 11 pm (toTime).

## Returns: [Alert]

*class* Alert

| **Name**        | **Type**                                       | **Description**                                                                                                                                                                                 |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id              | Int                                            | The ID number of the alert.                                                                                                                                                                     |
| message         | String                                         | The message of the alert.                                                                                                                                                                       |
| fromDate        | String                                         | The first date that the alert begins taking effect.  UTC-formatted date string (e.g. “2018-04-10T04:00:00.000Z”)                                                                                |
| toDate          | String                                         | The last date that the alert begins taking effect.  UTC-formatted date string (e.g. “2018-04-10T04:00:00.000Z”)                                                                                 |
| fromTime        | String                                         | The start time during the date range that the alert is in effect.  UTC-formatted date string (e.g. “2018-04-10T04:00:00.000Z”)                                                                  |
| toTime          | String                                         | The start time during the date range that the alert is in effect.  UTC-formatted date string (e.g. “2018-04-10T04:00:00.000Z”)                                                                  |
| priority        | Int                                            | Priority of the alert, from 0 (highest) to 3 (lowest).  Potential Return Values: [0, 1, 2, 3]                                                                                                   |
| daysOfWeek      | String                                         | A String enum representing a day of the week:   Potential Return Values: ["Every day”, “Weekend”, “Weekdays”, “Monday”, “Tuesday”, “Wednesday”, “Thursday”, “Friday”, “Saturday”, “Sunday”, “”] |
| routes          | [Int]                                          | A list of route numbers affected by alert.                                                                                                                                                      |
| signs           | [Int]                                          | A list of ??? affected by the alert.                                                                                                                                                            |
| channelMessages | [{  ChannelId: Int? Message: String?  }]       | A list of ChannelMessage objects. Improve description.                                                                                                                                          |



----------
# **/allstops** • GET

**Description:** Return a list of TCAT bus stops to show as a possible start / end location. A list should be included in the app, and periodically updated every so often.

## Returns: [BusStop]

*class* **BusStop**

| **Name** | **Type** | **Description**                           |
| -------- | -------- | ----------------------------------------- |
| name     | String   | The name of the bus stop.                 |
| lat      | Double   | The latitude coordinate of the bus stop.  |
| long     | Double   | The longitude coordinate of the bus stop. |



----------
# **/delay** • GET

**Description:** Returns the bus delay for a bus at a specific stop

## Parameters

*required* **stopID** : String

| **description** | The stop you want to get the delay for |
| --------------- | -------------------------------------- |
| **notes**       | n/a                                    |

*required* **tripID** : String

| **description** | The tripID for the route |
| --------------- | ------------------------ |
| **notes**       | n/a                      |

## Returns: Int?
| **Name** | **Type** | **Description**                                                                           |
| -------- | -------- | ----------------------------------------------------------------------------------------- |
| delay    | Int?     | The bus delay for **stopID**. If delay is nil, means we don’t have delay information yet. |



----------
# **/route** • GET

**Description**: Return a list of the best available routes based on the passed in parameters

## Parameters

*required* **start** : String - “<latitude : Double>,<(longitude : Double>”

| **description** | The starting point of the journey.                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **default**     | current location (set by client)                                                                                             |
| **notes**       | This can be a bus stop, a location found in Google Places (see Place ID docs), or coordinates (e.g. user’s current location) |

*required* **end** : String - “<latitude : Double>,<(longitude : Double>”

| **description** | The ending point of the journey. |
| --------------- | -------------------------------- |
| **default**     | n/a                              |
| **notes**       | See Start notes                  |

*required* **time** : Int

| **description** | The relevant time in the request.                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **default**     | now (set by client)                                                                                                                                                                                                                      |
| **notes**       | If **arriveBy** is false, departBy functionality is used. The time is when the journey should at earliest begin by.
Otherwise, the time is when the route should arrive to the destination by

Time is in epoch (seconds since 1/1/1970) |

*required* **arriveBy** : Bool

| **description** | Whether the request requires the route to arrive at the destination by **time** |
| --------------- | ------------------------------------------------------------------------------- |
| **default**     | false (set by client)                                                           |
| **notes**       | n/a                                                                             |

*required* **destinationName** : String

| **description** | The name of the destination of the trip                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **default**     | n/a                                                                                                       |
| **notes**       | Used to change the final direction to the destination, as well as check if the destination is a bus stop. |

## Returns: [Route]

*class* **Route**

| **Name**          | **Type**                                                                          | **Description**                                                                                 |
| ----------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| departureTime     | String                                                                            | The time a user begins their journey (e.g. when to start walking)                               |
| arrivalTime       | String                                                                            | The time a user arrives at their destination.                                                   |
| directions        | [Direction]                                                                       | A list of Direction objects (used for the Route Detail page). See Direction object              |
| startCoords       | {  lat: Double,  long: Double  }                                                | Starting location of user                                                                       |
| endCoords         | {  lat: Double,  long: Double  }                                                | Ending location of user                                                                         |
| boundingBox       | {  maxLat: Double,  maxLong: Double,  minLat: Double,  minLong: Double  } | The most extreme points of the route. Used to center the map on client-side (with some padding) |
| numberOfTransfers | Int                                                                               | Number of transfers in route. Default 0.                                                        |


*class* **Direction**

| **Name**             | **Type**                              | **Description**                                                                                                                                                                                           |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type                 | String                                | An enum for the type of location (walk, depart)                                                                                                                                                           |
| name                 | String                                | **walk:** The description of the place / location the user is walking to  **depart:** The name of the bus stop where the bus is departing from  Note: “arrive” and “transfer” exist, but only on front-end |
| startTime            | Date                                  | The starting time (UTC) associated with the direction  Format: `"yyyy-MM-dd'T'HH:mm:ssZZZZ"`                                                                                                               |
| endTime              | Date                                  | The ending time (UTC) associated with the direction  Format: `"yyyy-MM-dd'T'HH:mm:ssZZZZ"`                                                                                                                 |
| startLocation        | {  lat: Double,  long: Double  }    | The starting location associated with the direction                                                                                                                                                       |
| endLocation          | {  lat: Double,  long: Double  }    | The ending location associated with the direction                                                                                                                                                         |
| path                 | [{  lat: Double,  long: Double  }]  | The corresponding path of the direction                                                                                                                                                                   |
| distance             | Double                                | The total distance of the direction (meters).                                                                                                                                                             |
| routeNumber          | Int?                                  | **depart:** The number representing the bus route.  **other:** null.                                                                                                                                      |
| stops                | [{  name: String,  id: String,  }] | **depart:** An array of bus stop names that are passed, *including the departure and arrival stop*.  **other:** Return [ ]                                                                                |
| stayOnBusForTransfer | Bool                                  | Whether the user should stay on the bus for an upcoming transfer. It is assumed the bus line number will become the next respective **routeNumber** in the next .depart Direction.                        |
| tripIdentifiers      | [String]?                             | The unique identifier(s) for the specific bus related to the direction. Only exists when **type** is .depart.                                                                                             |
| delay                | Int?                                  | The bus delay for **stops**[0]. If delay is nil, means we don’t have delay information yet                                                                                                                |



----------
# **/tracking** • POST

**Description:** Return a list information about live bus locations

## Request Body
    {
      "data" : [
        {
          “stopID” : String, 
          “routeID” : String,
          “tripIdentifiers” : [String]
        },
        …
      ]
    }

*required* **stopID** : String

| **description** | The unique identifier for a bus stop.                                         |
| --------------- | ----------------------------------------------------------------------------- |
| **notes**       | This is the bus stop that will be used to determine the **delay** of the bus. |

*required* **routeID** : Int

| **description** | The number of the bus route. |
| --------------- | ---------------------------- |
| **notes**       | n/a                          |

*required* **tripID** : [String]

| **description** | The unique trip identifiers for the specific **routeID**.               |
| --------------- | ----------------------------------------------------------------------- |
| **notes**       | Can be 1 or more Strings, depending on if the route loops and restarts. |

## Returns: BusLocation

*class* **BusLocation**

| **Name**      | **Type** | **Description**                                                                                                                                                                                                            |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| case          | string   | ‘noData’ - means the bus for the trip does not support live tracking.  ‘validData’ - means we have all the proper tracking info.  ‘invalidData’ - means the trip is too far in the future. No bus has been assigned it yet. |
| commStatus    | String   | Unknown, some sort of communication status.  Example: GOOD                                                                                                                                                                  |
| destination   | String   | The final destination of the bus.  Example: Cornell-Mall, Cornell-Downtown                                                                                                                                                 |
| deviation     | Int      | Unknown.  Example: 0, 1, 2                                                                                                                                                                                                  |
| **delay**     | Int      | The number of seconds that the bus is behind schedule. If negative, the bus is early.                                                                                                                                      |
| direction     | String   | Character representing type of bus direction: Inbound or Outbound.  Example: I, O                                                                                                                                            |
| displayStatus | String   | The displayed status of the bus.  Example: Late, On Time                                                                                                                                                                    |
| gpsStatus     | Int      | Unknown.  Example: 2                                                                                                                                                                                                        |
| **heading**   | Int      | The direction of the bus in degrees.  Example: 156, 0                                                                                                                                                                       |
| lastStop      | String   | The last stop the bus visited.  Example: Risley Hall                                                                                                                                                                       |
| lastUpdated   | Date     | The time the data was last updated.  Example: Integer (time since 1970) // 2017-08-30T18:01:52                                                                                                                             |
| **latitude**  | Double   | The latitude coordinate of the bus.  Example: 42.449831                                                                                                                                                                    |
| **longitude** | Double   | The longitude coordinate of the bus.  Example: -76.482909                                                                                                                                                                  |
| name          | Int      | Unknown. The name of the bus?  Example: 702, 1105                                                                                                                                                                           |
| speed         | Int      | The speed of the bus (mph).  Example: 0, 15                                                                                                                                                                                 |
| opStatus      | String   | The status of the bus.  Example: ONTIME,  TRIP START                                                                                                                                                                       |
| routeID       | Int      | The bus number.  Example: 30                                                                                                                                                                                               |
| runID         | Int      | Four-figit identification number relating to Unknown.  Example: 7000, 7032                                                                                                                                                  |
| tripID        | Int      | Four-figit identification number relating directly to trip.  Example: 1818, 1838                                                                                                                                            |
| vehicleID     | Int      | Four-figit identification number relating directly to bus.  Example: 1105, 1603                                                                                                                                             |


**Example Response**
*Truncated for clarity’s sake.*


    {
        "departureTime": "2018-02-21T17:03:58Z",
        "arrivalTime": "2018-02-21T17:30:53Z",
        "directions": [
          {
            "type": "walk",
            "name": "Carpenter Hall",
            "startTime": "2018-02-21T17:03:58Z",
            "endTime": "2018-02-21T17:07:05Z",
            "startLocation": {
              "lat": 42.442587422005,
              "long": -76.484906572292
            },
            "endLocation": {
              "lat": 42.444763349997,
              "long": -76.485057394618
            },
            "path": [
              {
                "lat": 42.442587422005,
                "long": -76.484906572292
              },
              {
                "lat": 42.442584986446,
                "long": -76.485034111553
              },
              {
                "lat": 42.442584241388,
                "long": -76.485062610024
              },
              ...
            ],
            "distance": 267.52095889457,
            "routeNumber": null,
            "stops": [
              
            ]
          },
          {
            "type": "depart",
            "name": "Carpenter Hall",
            "startTime": "2018-02-21T17:07:05Z",
            "endTime": "2018-02-21T17:27:00Z",
            "startLocation": {
              "lat": 42.444888892283,
              "long": -76.484992947094
            },
            "endLocation": {
              "lat": 42.482619937121,
              "long": -76.489913869424
            },
            "path": [
              {
                "lat": 42.444888892283,
                "long": -76.484992947094
              },
              {
                "lat": 42.445609922236,
                "long": -76.482604849695
              },
              {
                "lat": 42.445609922236,
                "long": -76.482604849695
              },
              ...
            ],
            "distance": 5892.282,
            "routeNumber": 99,
            "stops": [
              {
                "name": "Carpenter Hall",
                "lat": 42.444889,
                "long": -76.484993
              },
              {
                "name": "Statler Hall",
                "lat": 42.44561,
                "long": -76.482605
              },
              ...
              {
                "name": "YMCA",
                "lat": 42.48597,
                "long": -76.488831
              },
              {
                "name": "The Shops At Ithaca Mall",
                "lat": 42.48262,
                "long": -76.489914
              }
            ]
          },
          {
            "type": "walk",
            "name": "your destination",
            "startTime": "2018-02-21T17:27:00Z",
            "endTime": "2018-02-21T17:30:53Z",
            "startLocation": {
              "lat": 42.481811176579,
              "long": -76.489391956241
            },
            "endLocation": {
              "lat": 42.482933792835,
              "long": -76.491880636481
            },
            "path": [
              {
                "lat": 42.481811176579,
                "long": -76.489391956241
              },
              {
                "lat": 42.481757904926,
                "long": -76.491481471616
              },
              {
                "lat": 42.482254672399,
                "long": -76.491524871249
              },
              ...
            ],
            "distance": 323.82797734023,
            "routeNumber": null,
            "stops": [
              
            ]
          }
        ],
        "startCoords": {
          "lat": 42.442587422005,
          "long": -76.484906572292
        },
        "endCoords": {
          "lat": 42.482933792835,
          "long": -76.491880636481
        },
        "boundingBox": {
          "minLat": 42.442584,
          "minLong": -76.491881,
          "maxLat": 42.48597,
          "maxLong": -76.480324
        },
        "numberOfTransfers": 0
      }


