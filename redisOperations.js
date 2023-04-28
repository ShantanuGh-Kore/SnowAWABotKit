var Promise = require('bluebird');
var config = require('./config');
var redis = require("./lib/RedisClient.js").createClient(config.redis);


function insertRedisWithUserData(userId, data) {
    if(data.metaTags){
        delete data.metaTags;
        console.log("deleted metaTags in the data object before putting into redis");
    }
    return new Promise(function(resolve, reject) {
        redis.hmset(`${config.redis.keyPrefix}_UserId:${userId}`, 'time', new Date(), 'data', JSON.stringify(data), function(err, reply) {
            resolve(reply);
        });
    })
}

function getRedisData(key) {
    return new Promise(
        function(resolve, reject) {
            redis.hgetall(key, function(err, object) {
                if (err)
                    reject(err);
                else
                if (object) {
                    var resp;
                    try {
                        resp = JSON.parse(object.data)
                    } catch (e) {
                        resp = object.data;
                    }
                    resolve(resp)
                } else
                    resolve(undefined);
            });
        });
}

function deleteRedisData(key) {
    redis.del(key, function(err, reply) {
        console.log(key,':: deleted data --------', reply);
    });
}

module.exports.insertRedisWithUserData = insertRedisWithUserData;
module.exports.getRedisData = getRedisData;
module.exports.deleteRedisData = deleteRedisData;
