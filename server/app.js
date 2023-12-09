var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var proto = grpc.loadPackageDefinition(packageDefinition).lights
//not sure if this should be a var or a const.,  might rename it lightsObject
var lights = [];
var telemetryData = {};
var server = new grpc.Server()

server.addService(proto.LightReg.service, {
  RegStreetLight: (call, callback) => {
    const { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, is_on } = call.request;

    const newLight = { streetLightId, streetLightName, streetLightZone, streetLightLat, streetLightLong, is_on };
    //lights[streetLightId] = { streetLightName, streetLightZone, streetLightLat, streetLightLong, is_on: false };
    lights.push(newLight);
    console.log(`Registered Streetlight: ${streetLightName} (${streetLightId})`);

    callback(null, { streetLightRegStatus: true, message: "Light Registered" });
    //console log all details to confirm they exist
    console.log("The lights are ", lights);
  },
  
});

  //checking the var light 
  if(Object.keys(lights).length > 0){
    console.log("the lights in the var lights are ", lights);
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
for (const light of lights) {
  console.log('print out of lights first ', lights);
  const lightsInfo = {
    streetLightId: light.streetLightId,
    streetLightName: light.streetLightName,
    streetLightZone: light.streetLightZone,
    streetLightLat: light.streetLightLat,
    streetLightLong: light.streetLightLong,
    //is_on: light.is_on,
  };
  
  console.log('My server write to lightsInfo ', lightsInfo);
  console.log('My server write to lights ', lights);
  call.write(lightsInfo);
  
}
call.end();


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
