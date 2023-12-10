var readline = require('readline')
var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var lights = grpc.loadPackageDefinition(packageDefinition).lights;

var telemetryClient = new lights.Telemetry("0.0.0.0:40000", grpc.credentials.createInsecure());

function mathRandomLux() {
  return Math.floor(Math.random() * 101);
}

function sendTelemetry() {
  var telemetryData = [
    { sensorId: "LIGHTSENSE0001", sensorZone: "1", luxReading: mathRandomLux() },
    { sensorId: "LIGHTSENSE0002", sensorZone: "2", luxReading: mathRandomLux() },
    { sensorId: "LIGHTSENSE0003", sensorZone: "3", luxReading: mathRandomLux() }
  ];

  var telemetryStream = telemetryClient.StreamTelemetry(function(error, response) {
    if (error) {
      console.error('there has been an error in telemetry service', error);
    } else {
      console.log(response.message);
    }
  });

  telemetryData.forEach(data =>{
    telemetryStream.write(data);
  });

  telemetryStream.end();
}


setInterval(sendTelemetry, 50000);

/*
var telemetryStream = telemetryClient.StreamTelemetry(function(error, response) {
    if (error) {
      console.error('Error Telementry Service :', error);
    } else {
      console.log(response.message);
    }
  });

  telemetryStream.write({ sensorId: "LIGHTSENSE0001", sensorZone: "1", luxReading: 70.0 });
  telemetryStream.write({ sensorId: "LIGHTSENSE0002", sensorZone: "2", luxReading: 55.0 });
  telemetryStream.write({ sensorId: "LIGHTSENSE0003", sensorZone: "3", luxReading: 59.0 });

  telemetryStream.end();

*/




  


