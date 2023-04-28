var sdk = require("../sdk");
var serviceHandler = require("./serviceHandler").serviceHandler;
var apiPrefix = require("../../config").app.apiPrefix;
var snowConversation = require("../../snowConversation.js")
var doRedirection = require("../../otsukaRedirection").doRedirection;
var jwtService = require("../../jwtService").jwtService;
var jweService = require("../../jwtService").jweService;

function loadroutes(app) {
    app.post(apiPrefix + '/sdk/bots/:botId/components/:componentId/:eventName', function (req, res) {
        var reqBody = req.body;
        var botId = req.params.botId;
        var componentId = req.params.componentId;
        var eventName = req.params.eventName;

        serviceHandler(req, res, sdk.runComponentHandler(botId, componentId, eventName, reqBody));
    });
    app.post(apiPrefix + '/sdk/bots/:botId/:eventName', function (req, res) {
        var reqBody = req.body;
        var botId = req.params.botId;
        var eventName = req.params.eventName;

        serviceHandler(req, res, sdk.runComponentHandler(botId, 'default', eventName, reqBody));
    });
    app.get('/healthCheck', function (req, res) {
        setTimeout(function () {
            res.send('am working')
        }, 10000)
    });
    app.get(apiPrefix + '/gethistory', snowConversation.gethistory);

    app.post(apiPrefix + '/sendToBotUser', function (req, res) {
        console.log('in routes ==================\n', JSON.stringify(req.body))
        try {
            snowConversation.sendMessagetoBotUser(req);
        } catch (err) {
            console.log(`Error in send to bot user Route :: Err ${err}`);
        }
        // console.log()
        return res.status(200).send({
            "status": "success"
        })
    });
    app.get(apiPrefix, function (req, res, next) {
        res.status(200).send({
            "status": "I'm running."
        })
    })

    app.post(apiPrefix + "/api/jwt/users/sts", jwtService)
    app.post(apiPrefix + "/api/jwe/users/sts", jweService)
}

module.exports = {
    load: loadroutes
};
