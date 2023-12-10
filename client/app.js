var readline = require('readline')
var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var lights = grpc.loadPackageDefinition(packageDefinition).lights;
var lightRegClient = new lights.LightReg("0.0.0.0:40000", grpc.credentials.createInsecure());
//removiing other lights, so each client is a different light for the bidirectional control.
lightRegClient.RegStreetLight({ streetLightId: "LIGHT0001", streetLightName: "Park Light 1", streetLightZone: 1, streetLightLat: 53.34889, streetLightLong: -6.31336, streetLightOn: false }, handleResponse);
//lightRegClient.RegStreetLight({ streetLightId: "LIGHT0002", streetLightName: "Park Light 2", streetLightZone: 2, streetLightLat: 53.35027, streetLightLong: -6.31530, streetLightOn: false }, handleResponse);
//lightRegClient.RegStreetLight({ streetLightId: "LIGHT0003", streetLightName: "Park Light 3", streetLightZone: 3, streetLightLat: 53.35233, streetLightLong: -6.32303, streetLightOn: false }, handleResponse);

function handleResponse(error, response) {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(response.message);
    }
  }
  var controlCommsClient = new lights.ControlComms("0.0.0.0:40000", grpc.credentials.createInsecure());
  controlStream = controlCommsClient.ControlLights();
  // Example: Send a message to the server
  var clientMessage = { name: "I'm ", message: "Zone 1" };
  
  controlStream.write(clientMessage);

  controlStream.on("data", (serverMessage) => {
      // incoming messages from the server
      console.log(`Received message from server: ${serverMessage.name} - ${serverMessage.message}`);
    })
  controlStream.on("end", () => {
      // Server has ended the streaming
      console.log("Server has ended the streaming.");
    });
  controlStream.on("error", (e) => {
  console.error("Error in ControlLights:", e);
  });








  


