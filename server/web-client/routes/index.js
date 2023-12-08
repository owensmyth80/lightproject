var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../protos/lights.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var lightsProto = grpc.loadPackageDefinition(packageDefinition).lights;
var lightRegClient = new lightsProto.LightReg('0.0.0.0:40000', grpc.credentials.createInsecure());


/* where i am passing the info back to the server with the click button calling. */
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


/* this isn't working, lost in the arrays and i'm tired. 
  router.get('/lightsData', function(req, res, next) {
    try{
      console.log('Console out of lights ', lights);
      res.render('lightsData', { title: 'Lights Data', lights: lights})
        } catch (error) {
          console.log(error);
          res.render('lightsData', { title: 'Lights Data', lights: null})
        }
      });      
    
*/
 
module.exports = router;
