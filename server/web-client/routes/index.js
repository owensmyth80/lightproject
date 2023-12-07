var express = require('express');
var router = express.Router();
var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');

var PROTO_PATH = __dirname + '/../protos/lights.proto';
var packageDefinition = protoLoader.loadSync(PROTO_PATH);
var lightsProto = grpc.loadPackageDefinition(packageDefinition).lights;
var lightRegClient = new lightsProto.LightReg('0.0.0.0:40000', grpc.credentials.createInsecure());


/* GET home page. */
router.get('/regLights', function(req, res, next) {
  try{
    lightRegClient.RegStreetLight({ streetLightId: 'LIGHT001', streetLightName: 'Test Light', streetLightZone: 1, streetLightLat: 0, streetLightLong: 0 },
    {
      function (error, response){
      try {
        res.render('index', { title: 'Light Registration', error: error, result: response.result });

      } catch (error) {
        console.log(error)
        res.render('index', { title: 'Light Registration', error: "Light Registration service not available", result: null });
      }
    }
    });      
  
} catch (error) {
  console.log(error)
  
  res.render('index', { title: 'Light Registration', error: "Light Registration service not available", result: null });
      }
  });      

module.exports = router;
