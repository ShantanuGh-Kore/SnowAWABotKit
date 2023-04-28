var config = require('./config');
var request = require('request-promise');


function generateBody(requestId, action, clientSessionId, messageText, messageTyped, userId, emailId) {
    console.log(`In geneate body ::::> Request Id = ${requestId} :: Client Session Id = ${clientSessionId} :: Email Id = ${emailId}`);
    var requestBody = {
        "requestId": requestId,//data.context.session.UserContext._id,
        "clientSessionId": clientSessionId,//data.context.session.BotUserSession.conversationSessionId,
        "token": config.servicenow.userId,
        "message": {
            "text": messageText,//"live agent support.",
            "typed": messageTyped,//true,
            "clientMessageId": config.servicenow.clientMessageId
        },
        "userId": userId,//data.context.session.BotUserSession.fname,
        "guest": false,
        "emailId": emailId,//data.context.session.BotUserSession.email
    }
    if (action) {
        requestBody.action = action
    }
    return requestBody;
}


function createChatQueue(data) {
    console.log(`In Create Chat Queue ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId}`);
    var url = `${config.servicenow.host}/api/sn_va_as_service/bot/integration`;
    var options = {
        method: 'POST',
        uri: url,
        body: data,
        json: true,
        headers: {
            'Content-Type': 'application/json',  // Set automatically
            'Authorization': config.servicenow.authorization,
            'Accept': 'application/json'
        }
    };
    return request(options).then(function (res) {
        // console.log(`In Create Chat Queue ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId} :: Chat queue is created :: Response = ${JSON.stringify(res)}`);
        return res;
    }).catch(function(err){
        console.log(`In Create Chat Queue ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId} :: Error = ${err}`);
    });
}


function sendMessageToLiveAgent(data, group) {
    console.log(`In Send Message To Live Agent ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId}`);
    // console.debug(`In Send Message To Live Agent  ::::> ${JSON.stringify(data)}`)
    var url = `${config.servicenow.host}/api/sn_va_as_service/bot/integration`;
    var options = {
        method: 'POST',
        uri: url,
        body: data,
        json: true,
        headers: {
            'content-type': 'application/json',  // Set automatically
            'Authorization': config.servicenow.authorization,
            'Accept': 'application/json'
        }
    };
    return request(options).then(function (res) {
        // console.log(`In Send Message To Live Agent ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId} :: Message sent to the Agent :: Response = ${JSON.stringify(res)}`);
        return res;
    }).catch(function(err){
        console.log(`In Send Message To Live Agent ::::> Request Id = ${data.requestId} :: Client Session Id = ${data.clientSessionId} :: Email Id = ${data.emailId} :: Error = ${err}`);
    });
}

module.exports.CreateChatQueue = createChatQueue;
module.exports.SendMessageToLiveAgent = sendMessageToLiveAgent;
module.exports.generateBody = generateBody;