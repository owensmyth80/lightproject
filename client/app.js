var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var lights = grpc.loadPackageDefinition(packageDefinition).lights;
var lightRegClient = new lights.LightReg("0.0.0.0:40000", grpc.credentials.createInsecure());
//fix ID to id
lightRegClient.RegStreetLight({ streetLightId: "LIGHT0001", streetLightName: "Park Light 1", streetLightZone: 1, streetLightLat: 53.34889, streetLightLong: -6.31336, is_on: false }, handleResponse);
lightRegClient.RegStreetLight({ streetLightId: "LIGHT0002", streetLightName: "Park Light 2", streetLightZone: 2, streetLightLat: 53.35027, streetLightLong: -6.31530, is_on: false }, handleResponse);
lightRegClient.RegStreetLight({ streetLightId: "LIGHT0003", streetLightName: "Park Light 3", streetLightZone: 3, streetLightLat: 53.35233, streetLightLong: -6.32303, is_on: false }, handleResponse);

function handleResponse(error, response) {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(response.message);
    }
  }

var telemetryClient = new lights.Telemetry("0.0.0.0:40000", grpc.credentials.createInsecure());
var telemetryStream = telemetryClient.StreamTelemetry(function(error, response) {
    if (error) {
      console.error('Error Telementry Service :', error);
    } else {
      console.log(response.message);
    }
  });

  telemetryStream.write({ sensorId: "LIGHTSENSE0001", sensorZone: "1", luxReading: 50.0 });
  telemetryStream.write({ sensorId: "LIGHTSENSE0002", sensorZone: "2", luxReading: 55.0 });
  telemetryStream.write({ sensorId: "LIGHTSENSE0003", sensorZone: "3", luxReading: 59.0 });

  telemetryStream.end();




  


