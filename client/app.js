var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var lights = grpc.loadPackageDefinition(packageDefinition).lights;
var client = new lights.LightReg("0.0.0.0:40000", grpc.credentials.createInsecure());
//fix ID to id
client.RegStreetLight({ streetLightId: "LIGHT0001", streetLightName: "Park Light 1", streetLightZone: 1, streetLightLat: 53.34889, streetLightLong: -6.31336 }, handleResponse);
client.RegStreetLight({ streetLightId: "LIGHT0002", streetLightName: "Park Light 2", streetLightZone: 2, streetLightLat: 53.35027, streetLightLong: -6.31530 }, handleResponse);
client.RegStreetLight({ streetLightId: "LIGHT0003", streetLightName: "Park Light 3", streetLightZone: 3, streetLightLat: 53.35233, streetLightLong: -6.32303 }, handleResponse);

function handleResponse(error, response) {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(response.message);
    }
  }
