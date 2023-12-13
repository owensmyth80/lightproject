var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var proto = grpc.loadPackageDefinition(packageDefinition).lights
//not sure if this should be a var or a const.,  might rename it lightsObject
var serverLightsArray = [];
var telemetryData = [];
var server = new grpc.Server()

//creating array serverLightsArray and pushing any new lights to it.
server.addService(proto.LightReg.service, {
  RegStreetLight: (call, callback) => {
    const { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn } = call.request;

    const newLight = { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, streetLightOn };
    //lights[streetLightId] = { streetLightName, streetLightZone, streetLightLat, streetLightLong, is_on: false };
    serverLightsArray.push(newLight);
    console.log(`Registered Streetlight: ${streetLightName} (${streetLightId})`);

    callback(null, { streetLightRegStatus: true, message: "Light Registered" });
    //console log all details to confirm they exist
    console.log("The lights are ", serverLightsArray);
  },
  
});

  //checking the var light 
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


server.addService(proto.Telemetry.service,  {
  StreamTelemetry: (call) => {
    call.on("data", (telemetryInfo) => {
      console.log("receving telemetry");

      telemetryData[telemetryInfo.sensorId] = telemetryInfo;


});
    call.on("end", function(){
      console.log("no more telemetry , ending ");
      console.log("telemetry data recevied was  ", telemetryData);
      //todo , some error handling here
      
});
    call.on('error', function(e){
      console.log('there has been and error')

    });
    },
  });

              
server.addService(proto.ControlMonitoring.service, {
  BroadcastLights: (call) => {
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

 // const sensorId = tempLightArray.sensorId;
 // if (telemetryData[sensorId]){
 //   lightsInfoBroadcast.telemetry = telemetryData[sensorId];

 // }
   // console.log('My server write to telemetry ', telemetryData);
    console.log('My server write to lightsInfoBroadcast ', lightsInfoBroadcast);
    console.log('My server write to serverLightsArray ', serverLightsArray);
 // console.log('My server write to lights ', lights);
      call.write(lightsInfoBroadcast);
  
}


call.end();


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
            //streetLightOn: true,   //not sure about this one, do i need it? it has no value here. but will show up undefined..
            messageCommand: "ON",
           // streetLightOn: ${serverLightsArray.streetLightOn},
          };    
          controlStream.write(responseMessage);

        }
        if (sensor.luxReading > 50) {
          const responseMessage = {
            name: "Server Says",
            messageZone: `Zone ${sensor.sensorZone}: Lights OFF (Lux Reading: ${sensor.luxReading})`,
            messageCommand: "OFF",
           // streetLightOn: ${serverLightsArray.streetLightOn},
          };    
          controlStream.write(responseMessage);
      }
    }
  }
  }, 50000); 
}

 server.addService(proto.ControlComms.service, {
  ControlLights: (call) => {
    // stream created
    const controlStream = server.controlStream = call;
    sendTelemetryUpdates(controlStream);
    // data int
    controlStream.on("data", (chatMessage) => {
      // inbound clients
      //console.log(`Received message from client: ${chatMessage.name} - ${chatMessage.messageZone} StreetLight On is: ${chatMessage.streetLightOn}`);
      console.log(`Received message from client: ${chatMessage.name} - ${chatMessage.messageZone} - ${chatMessage.messageCommand}`);

      // writing to all connected clients
      controlStream.write(chatMessage);

      // response message to be updated to include the if from telemetry, 
      /*
      const responseMessage = {
        name: "Server says Zone 1 Update",
        message: "Server received your message.",
      };
      
     for (const sensorId in telemetryData){
        if (telemetryData.hasOwnProperty(sensorId)){
          const sensor = telemetryData[sensorId];
          if(sensor.luxReading > 50){
            const responseMessage = {
              name: "Server sayss",
              message: `Zone ${sensor.sensorZone}: Lights On (Lux Reading: ${sensor.luxReading})`
            };
          controlStream.write(responseMessage);
          }


        }


     }
 */     
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

    /*/ Send lights info to the client as they become available.. ffs object, i'm using array
    for (const streetLightId in lights) {
      if (lights.hasOwnProperty(streetLightId)) {
        const light = lights[streetLightId];
        const lightsInfo = {
          streetLightId: light.streetLightId,
          streetLightName: light.streetLightName,
          streetLightZone: light.streetLightZone,
          streetLightLat: light.streetLightLat,
          streetLightLong: light.streetLightLong,
          is_on: light.is_on,
          };      
          console.log('My server write to lightsInfo ', lightsInfo);
          console.log('My server write to lights ', lights);
          call.write(lightsInfo);
        }
      }
      call.end();
      //console.log('My server side console out of lights data ', lights);


    },
    */
 
 
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
