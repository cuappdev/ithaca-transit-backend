# Ithaca Transit Backend

## Setup

Please ensure `npm` ([npm](https://www.npmjs.com/get-npm)) and `docker` ([docker](https://www.docker.com/)) is installed by checking `npm -v` and `docker -v` and that Docker is running.


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

# Transit API v1 REST Interface

# Endpoints

**Base URL: localhost:3000** (local default)
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

**Note:** The type field refers to the type of place. We currently have two different possible types, `busStop` and `googlePlace`. Look at `/search` for further details.

## Returns: [BusStop]

*class* **BusStop**

| **Name** | **Type** | **Description**                           |
| -------- | -------- | ----------------------------------------- |
| name     | String   | The name of the bus stop.                 |
| lat      | Double   | The latitude coordinate of the bus stop.  |
| long     | Double   | The longitude coordinate of the bus stop. |
| type     | String   | This is just the string "busStop".        |



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
# **/v2/route** • POST 

**Description**: Return routes based on the passed in parameters. Routes are categorized as being **fromStop**, **boardingSoon**, or **walking**.

## Parameters

*required* **start** : String - “<latitude : Double>,<longitude : Double>”

| **description** | The starting point of the journey.                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **default**     | current location (set by client)                                                                                             |
| **notes**       | This can be a bus stop, a location found in Google Places (see Place ID docs), or coordinates (e.g. user’s current location) |

*required* **end** : String - “<latitude : Double>,<longitude : Double>”

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

*required* **isArriveBy** : Bool

| **description** | Whether the request requires the route to arrive at the destination by **time** |
| --------------- | ------------------------------------------------------------------------------- |
| **default**     | false (set by client)                                                           |
| **notes**       | n/a                                                                             |

*required* **destinationName** : String

| **description** | The name of the destination of the trip                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **default**     | n/a                                                                                                       |
| **notes**       | Used to change the final direction to the destination, as well as check if the destination is a bus stop. |

## Returns:

```
{
    "data": {
        "fromStop": [Route],
        "boardingSoon": [Route],
        "walking": [Route]
    }
}
```

----------
# **/multiroute** • GET

**Description**: Returns the best available route for each destination specified from a single start location

## Parameters

*required* **start** : String - “< latitude Double >,< longitude Double >”

| **description** | The starting point of the journey.                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **default**     | current location (set by client)                                                                                             |
| **notes**       | This can be a bus stop, a location found in Google Places (see Place ID docs), or coordinates (e.g. user’s current location) |

*required* **time** : Int

| **description** | The relevant time in the request.                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **default**     | now (set by client)                                                                                                                                                                                                                      |
| **notes**       | If **arriveBy** is false, departBy functionality is used. The time is when the journey should at earliest begin by.
Otherwise, the time is when the route should arrive to the destination by

Time is in epoch (seconds since 1/1/1970) |

*required* **end** : [String] - “[“< latitude Double >,< longitude Double >”]”

| **description** | An array of latitude-longitude strings to specify ending points. Must contain at least one ending point. Should be the same length as **destinationNames**. |
| --------------- | -------------------------------- |
| **default**     | n/a                              |
| **notes**       | See Start notes                  |

*required* **destinationNames** : [String] - “[< destinationName1 >]”

| **description** | The names of the destinations. Must contain at least one.                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **default**     | n/a                                                                                                       |
| **notes**       | Each destination is used to change the final direction to the destination, as well as check if the destination is a bus stop. |

*optional*
**Add more destinations as needed, each must be in order and have an end location and name**

## Returns: [Route]

Returns an array of Routes, one for each destination.

*class* **Route**

| **Name**          | **Type**                                                                          | **Description**                                                                                 |
| ----------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| departureTime     | String                                                                            | The time a user begins their journey (e.g. when to start walking)                               |
| arrivalTime       | String                                                                            | The time a user arrives at their destination.                                                   |
| directions        | [Direction]                                                                       | A list of Direction objects (used for the Route Detail page). See Direction object              |
| startCoords       | {  lat: Double,  long: Double  }                                                | Starting location of user                                                                       |
| endCoords         | {  lat: Double,  long: Double  }                                                | Ending location of user                                                                         |
| boundingBox       | {  maxLat: Double,  maxLong: Double,  minLat: Double,  minLong: Double  } | The most extreme points of the route. Used to center the map on client-side (with some padding) |
| numberOfTransfers | Int                                                                               | Number of transfers in route. Default 0.    

----------
# **/search** • POST

**Description**: Returns a list of bus stops and google autocomplete search results given a query string.

## Parameters

*required* **query** : String

| **description** | The user's search query for a bus stop or place.                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **notes**       | This can be any string the user types in. |

## Returns: [JSON]

Returns an array of places, which can identify as either "busStop" or "googlePlace".

**busStop**

| **Name** | **Type** | **Description**                           |
| -------- | -------- | ----------------------------------------- |
| type     | "busStop" | The type of search suggestion. |
| name     | String   | The name of the bus stop.                 |
| lat      | Double   | The latitude coordinate of the bus stop.  |
| long     | Double   | The longitude coordinate of the bus stop. |


**googlePlace**

| **Name** | **Type** | **Description**                           |
| -------- | -------- | ----------------------------------------- |
| type     | "googlePlace" | The type of search suggestion. |
| detail     | String   | The address of the place.                |
| name      | Double   | The name of the place.  |
| placeID    | Double   | The Google place ID. |

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

## Returns: [BusLocation]

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

# Examples Responses

## /route
*Truncated for clarity.*


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


