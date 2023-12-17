var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var proto = grpc.loadPackageDefinition(packageDefinition).lights
//declaring my array
var serverLightsArray = [];
var telemetryData = [];
var server = new grpc.Server()

//the LightReg service for clients to register new lights in the server.
//creating array serverLightsArray and pushing any new lights to it.
//adding additional error handling given the marking schemee.
server.addService(proto.LightReg.service, {
  RegStreetLight: (call, callback) => {
    try{
    const { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn } = call.request;

    const newLight = { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn };
    //lights[streetLightId] = { streetLightName, streetLightZone, streetLightLat, streetLightLong, is_on: false };
    serverLightsArray.push(newLight);
    console.log(`Registered Streetlight: ${streetLightName} (${streetLightId})`);

    callback(null, { streetLightRegStatus: true, message: "Light Registered" });
    //console log all details to confirm they exist
    console.log("The lights are ", serverLightsArray);
    //catch in error and console out.
    } catch (error){
      console.error('Error in RegStreetLight');
    }
  },

});

  //checking for the values in the Light Array and outputting them
  if(Object.keys(serverLightsArray).length > 0){
    console.log("the lights in the var lights are ", serverLightsArray);
  }
  else{
    console.log("nothing in the var lights");
    
  }
    //checking the var telemetryData 
  if(Object.keys(telemetryData).length > 0){
    console.log("the received telemetry is  ", telemetryData);
  }
  else{
    console.log("nothing in the var telmetryData ");
      
  }

//adding try and catch for error handling.
server.addService(proto.Telemetry.service,  {
  StreamTelemetry: (call) => {
    call.on("data", (telemetryInfo) => {

      try{
      console.log("receving telemetry");

      telemetryData[telemetryInfo.sensorId] = telemetryInfo;
      }catch (error){
        console.error('there has been an error with telemetry data', error);
      }

});
    call.on("end", function(){
      console.log("no more telemetry , ending ");
      console.log("telemetry data recevied was  ", telemetryData);
      
});
    call.on('error', function(e){
      console.log('there has been and error at telemetry stream', e);

    });
    },
  });

//ControlMonitoring is my server broadcast of the status of the lights in the lights array        
server.addService(proto.ControlMonitoring.service, {
  BroadcastLights: (call) => {
    //adding a try for improved error handling:
    try{
 // 
for (const tempLightArray of serverLightsArray) {
  console.log('print out of lights first ', serverLightsArray);
  const lightsInfoBroadcast = {
    streetLightId: tempLightArray.streetLightId,
    streetLightName: tempLightArray.streetLightName,
    streetLightZone: tempLightArray.streetLightZone,
    streetLightLat: tempLightArray.streetLightLat,
    streetLightLong: tempLightArray.streetLightLong,
    streetLightOn: tempLightArray.streetLightOn,
  };

  //take in the telemetry service and broadcast it here 

    console.log('My server write to lightsInfoBroadcast ', lightsInfoBroadcast);
    console.log('My server write to serverLightsArray ', serverLightsArray);
 // write out the values
      call.write(lightsInfoBroadcast);
  
}

call.on('error', (error) => {
  console.error('Error in BroadcastLights:', error);
});

call.end();
    }catch (error){
      console.error('there has been an error in broadcastLights', error);
    }

    },

 }); 
 //my function to have interval and provide updates fo telemtry data
 function sendTelemetryUpdates(controlStream) {
  setInterval(() => {
    for (const sensorId in telemetryData) {
      if (telemetryData.hasOwnProperty(sensorId)) {
        const sensor = telemetryData[sensorId];
        if (sensor.luxReading < 50) {
          const responseMessage = {
            name: "Server Says",
            messageZone: `Zone ${sensor.sensorZone}: Lights ON (Lux Reading: ${sensor.luxReading})`,
            //command to client to turn ON
            messageCommand: "ON",
          
          };    
          controlStream.write(responseMessage);

        }
        if (sensor.luxReading > 50) {
          const responseMessage = {
            name: "Server Says",
            messageZone: `Zone ${sensor.sensorZone}: Lights OFF (Lux Reading: ${sensor.luxReading})`,
            //command to client to turn OFF
            messageCommand: "OFF",
          };    
          controlStream.write(responseMessage);
      }
    }
  }
  }, 50000); 
}
  //bi-directional service for client <> communicationss to handle on/off commands based on the telemetry array values:
  server.addService(proto.ControlComms.service, {
  ControlLights: (call) => {
    
    // stream created
    const controlStream = server.controlStream = call;
    //using the function above.
    sendTelemetryUpdates(controlStream);
    
      controlStream.on("data", (chatMessage) => {
      try {  

      console.log(`Received message from client: ${chatMessage.name} - ${chatMessage.messageZone} - ${chatMessage.messageCommand}`);
      //checking for the index in the array for the light.streetLight
      const lightIndex = serverLightsArray.findIndex(light => light.streetLightId === chatMessage.name);
      
      //If here as this should only run if it is found.
      if (lightIndex !== -1) {
        // Update streetLightOn based on the messageCommand containing "change to true" or 'changed to false' - in real world i'd just 0 and 1 here.
        if (chatMessage.messageCommand.includes('changed to true')) {
          //update the streetLightOn value at index in the array value to true
          serverLightsArray[lightIndex].streetLightOn = true;
          
        } else if (chatMessage.messageCommand.includes('changed to false')) {
          //update the array value to false.
          serverLightsArray[lightIndex].streetLightOn = false;
        }
      }
      // writing to all connected clients
      controlStream.write(chatMessage);
    } catch (error){
      console.error('Error at client message on the server', error);
    }
    });

    controlStream.on("end", () => {
      // console log to end streaming if client does so
      console.log("Client has ended the streaming.");
    });

    controlStream.on("error", (e) => {
      // Handle errors
      console.error("Error in ControlLights:", e);
    });

    controlStream.on("status", (status) => {
      // Handle status updates
      console.log("Received status:", status);
    });
  },
});
 
 
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
