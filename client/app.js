var readline = require('readline')
var readlineSync = require('readline-sync')
var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"

var packageDefinition = protoLoader.loadSync(PROTO_PATH)
var lights = grpc.loadPackageDefinition(packageDefinition).lights;
var lightRegClient = new lights.LightReg("0.0.0.0:40000", grpc.credentials.createInsecure());

//changes these to variable, will want to modify the streetLightOn value based on server message in bi-directioanl
var streetLightId = "LIGHT0001";
var streetLightName = "Park  Light 1";
var streetLightZone = "1";
var streetLightLat = 53.34889;
var streetLightLong = -6.31336
var streetLightOn = false;
//removiing other lights, so each client is a different light for the bidirectional control.
lightRegClient.RegStreetLight({ streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn }, handleResponse);

//lightRegClient.RegStreetLight({ streetLightId: "LIGHT0001", streetLightName: "Park Light 1", streetLightZone: 1, streetLightLat: 53.34889, streetLightLong: -6.31336, streetLightOn: false }, handleResponse);
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
//  var clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`,streetLightOn: streetLightOn};
  var clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`}; 
  
  controlStream.write(clientMessage);

  controlStream.on("data", (serverMessage) => {
      // incoming messages from the server
      //console.log(`Received message from server: ${serverMessage.name} - ${serverMessage.messageZone} - ${serverMessage.streetLightOn} - ${serverMessage.messageCommand}`);
      console.log(`Received message from server: ${serverMessage.name} - ${serverMessage.messageZone} - ${serverMessage.messageCommand || 'No Message Command'}`);
    

    if (serverMessage.messageZone.includes(streetLightZone)) {
      // it should only apply if the Zone in message from server, is the same as the light zone
      if (streetLightOn) {
          // consider if the light was already set to on , by another telemetry
          clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`,messageCommand: 'Light already on, nothing to do'
          };
      } else {
          // if not true, then we set it to true and send comm back with confirmation
          streetLightOn = true;
          clientMessage = {
              name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: `Street light changed to ${streetLightOn}`
          };
      }
      controlStream.write(clientMessage);
  }
});
  controlStream.on("end", () => {
      // Server has ended the streaming
      console.log("Server has ended the streaming.");
    });
  controlStream.on("error", (e) => {
  console.error("Error in ControlLights:", e);
  });








  


