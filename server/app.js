var grpc = require("@grpc/grpc-js")
var protoLoader = require("@grpc/proto-loader")
var PROTO_PATH = __dirname + "/protos/lights.proto"
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH
)
var proto = grpc.loadPackageDefinition(packageDefinition).lights
//not sure if this should be a var or a const.,  might rename it lightsArray
var lights = {};
var server = new grpc.Server()

server.addService(proto.LightReg.service, {
  RegStreetLight: (call, callback) => {
    const { streetLightId, streetLightName, streetLightLat, streetLightLong } = call.request;

    lights[streetLightId] = { streetLightName, streetLightLat, streetLightLong, is_on: false };

    console.log(`Registered Streetlight: ${streetLightName} (${streetLightId})`);
    //console log all details to confirm they exist
    console.log("The lights are ", lights);
    callback(null, { streetLightRegStatus: true, message: "Light Registered" });
    
  },
});




server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), function() {
  server.start()
})
