var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../protos/lights.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var lightsProto = grpc.loadPackageDefinition(packageDefinition).lights;
//var lightRegClient = new lightsProto.LightReg('0.0.0.0:40000', grpc.credentials.createInsecure());
var controlMonitoringClient = new lightsProto.ControlMonitoring('0.0.0.0:40000', grpc.credentials.createInsecure());


/* where i am passing the info back to the server with the click button calling. 
router.get('/registerLights', function(req, res, next) {
  try{
    lightRegClient.RegStreetLight({ streetLightId: 'LIGHT001', streetLightName: 'Test Light', streetLightZone: 1, streetLightLat: 0, streetLightLong: 0 },
    
      function (error, response){
      try {
        res.render('index', { title: 'Light Registration', error: error, result: response.result });

      } catch (error) {
        console.log(error);
        res.render('index', { title: 'Light Registration', error: "Light Registration service not available", result: null });
      }
    });      
  
} catch (error) {
  console.log(error)
  
  res.render('index', { title: 'Light Registration', error: "Light Registration service not available", result: null });
      }
  });      
*/

  router.get('/lightsData', function(req, res, next) {
    try {
      const lightsStream = controlMonitoringClient.BroadcastLights({}); //this takes the stream from s
      const lightsDataReceived = [];
    //  const telemetryDataReceived = [];

      lightsStream.on('data', (lightMessage) => {
      //  const telemetryData = lightMessage.telemetry;
      //  console.log("telemetryData in index.htm has broadcast from server to web-client", lightMessage.telemetry);
        console.log("a light has broadcast from server to web-client light", lightMessage);
        console.log("a light has broadcast from server to web-client lightsDataRecieved", lightsDataReceived);
        lightsDataReceived.push(lightMessage);
        console.log("after the push to light ", lightMessage);
      });
  
      lightsStream.on('end', () => {

        console.log('LightsDataReceived console out from index.js in web-client :', lightsDataReceived);
        res.render('lightsData', { title: 'Lights Data', lightsOutToHtml: lightsDataReceived });
      });
  
      lightsStream.on('error', (error) => {
        console.error('Error fetching lights data:', error);
        res.render('lightsData', { title: 'Lights Data', lightsOutToHtml: null });
      });
    } catch (error) {
      console.log(error);
      res.render('lightsData', { title: 'Lights Data', lightsOutToHtml: null });
    }
  });     
    
 
module.exports = router;
