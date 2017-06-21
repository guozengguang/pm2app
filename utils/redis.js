var config = require('../config/config');
var redis = require('redis');

var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var client = redis.createClient(config.redis.port, config.redis.host);
client.on("error", function (err) {
    console.log("Error " + err);
});
client.auth(config.redis.password,function(err){
    if(err){
        console.log(err)
    }else {
        console.log('redis通过认证');
    }
});
module.exports = client;
