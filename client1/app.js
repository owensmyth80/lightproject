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
var streetLightName = "Phonex Park Vistors Centre";
var streetLightZone = "1";
var streetLightLat = 53.36700440153177;
var streetLightLong = -6.330489524428996;
var streetLightOn = false;
//removiing other lights, so each client is a different light for the bidirectional control.
lightRegClient.RegStreetLight({ streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn }, handleResponse);

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
  //had to add messageCommand as the server was crashing out after recent changes
  var clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: 'no command yet'}; 
  
  controlStream.write(clientMessage);
  //adding a try and catch for additioanl error logging.
  controlStream.on("data", (serverMessage) => {
    try {
      // incoming messages from the server
      console.log(`Received message from server: ${serverMessage.name} - ${serverMessage.messageZone} - ${serverMessage.messageCommand || 'No Message Command'}`);
    
//updated teh includes to have string Zone, to prevent the issues seen with it reading the number twice if it was also in the telemetry. 
    if (serverMessage.messageZone.includes('Zone '+ streetLightZone,) && (serverMessage.messageCommand === "ON")) {
      // it should only apply if the Zone in message from server, is the same as the light zone
      if (streetLightOn) {
          // consider if the light was already set to on , by another telemetry
          clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: 'Light already on, nothing to do'};
      } else {
          // if not true, then we set it to true and send comm back with confirmation
          streetLightOn = true;
          clientMessage = {
              name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: `Street light changed to ${streetLightOn}`
          };
      }
      console.log('what is street light now before client AT ON IF here '+streetLightOn);
      controlStream.write(clientMessage);
  }
    else if (serverMessage.messageZone.includes('Zone '+ streetLightZone,) && (serverMessage.messageCommand === "OFF")) {
    // it should only apply if the Zone in message from server, is the same as the light zone
      if (!streetLightOn) {
        // consider if the light was already set to OFF , by another telemetry
        clientMessage = {name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: 'Light already OFF, nothing to do'};
    }   else {
        // update to false, then we set it to true and send comm back with confirmation
        streetLightOn = false;
        clientMessage = {
            name: streetLightId, messageZone: `Zone ${streetLightZone}`, messageCommand: `Street light changed to ${streetLightOn}`
        };
    }
    console.log('what is street light now before client AT OFF IF here '+streetLightOn);
    controlStream.write(clientMessage);
  }
}catch (error){
  console.error('error at server message', error);
}
    controlStream.on("end", () => {
      // Server has ended the streaming
      console.log("Server has ended the streaming.");
    });
  controlStream.on("error", (e) => {
  console.error("Error in ControlLights:", e);
  });

});






  


