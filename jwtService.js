var jwt = require('jsonwebtoken');
var jose = require('node-jose');
var config = require("./config");

function jwtService(req, res, next) {
    console.log("JWT token generaion")
    if (!req.body.identity || !req.body.clientId || !req.body.clientSecret) {
        return res.status(400).send({ "message": "Required fields missing" })
    }
    var identity = req.body.identity;
    var clientId = req.body.clientId;
    var clientSecret = req.body.clientSecret;
    var isAnonymous = req.body.isAnonymous || false;
    var aud = req.body.aud || "https://idproxy.kore.com/authorize";

    var options = {
        "iat": new Date().getTime(),
        "exp": new Date(new Date().getTime() + 24 * 60 * 60 * 1000).getTime(),
        "aud": aud,
        "iss": clientId,
        "sub": identity,
        "isAnonymous": isAnonymous
    }
    var token = jwt.sign(options, clientSecret);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send({ "jwt": token });
}

function jweService(req, res, next) {
    console.log("JWE token generaion")

    var jwePublicKey = config.custom.jwePublicKey;
    var identity = req.body.identity;
    var clientId = req.body.clientId;
    var clientSecret = req.body.clientSecret;
    var isAnonymous = req.body.isAnonymous || false;
    var aud = req.body.aud || "https://idproxy.kore.com/authorize";
    var options = {
        "iat": Date.now() / 1000,
        "exp": Date.now() / 1000 + 1800,
        "aud": aud,
        "iss": clientId,
        "sub": identity,
        "isAnonymous": isAnonymous,
    }
    var headers = {};
    var token = jwt.sign(options, clientSecret, headers);

    jose.JWE.createEncrypt({
        format: "compact"
    }, jwePublicKey).update(token).final().then(function (encryptedToken) {
        res.header("Access-Control-Allow-Origin", "*");
        res.send({
            "jwt": encryptedToken,
        });
    });
}

module.exports.jwtService = jwtService;
module.exports.jweService = jweService;