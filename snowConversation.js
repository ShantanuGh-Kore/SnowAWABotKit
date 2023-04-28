var config = require('./config');
var botId = Object.keys(config.credentials);
var botName = "SNOW Live agent";
var sdk = require("./lib/sdk");
var _ = require('lodash');
var redisOperations = require("./redisOperations")


var snowAPI = require('./snowAPIs.js');


function getUserNameFromEmail(email) {
    console.log("email of the user : " + email)
    var emailParts = email.match(config.custom.emailRegex);
    return emailParts && emailParts.length === 4 ? emailParts[1].replace(".", " ") : ""
}

function chatHistoryParser(messages) {
    var parseChat = messages;
    var parsedMessage = "";
    var msgType = "";
    var count = parseChat.length;
    for (i = 0; i < count; i++) {
        var temp = parseChat[i].components[0].data.text;
        msgType = parseChat[i].type;
        if (msgType == "incoming") {
            msgType = "User says";
        } else {
            msgType = "Bot says";
        }
        if (!temp.includes("template")) {
            parsedMessage = parsedMessage + msgType + " : " + temp + "\n";
        } else {
            var temp1 = JSON.parse(parseChat[i].components[0].data.text);
            parsedMessage = parsedMessage + msgType + " : " + temp1.payload.text + "\n";
        }
    }
    return parsedMessage;
}


function chatHistoryParserForTeams(messages) {
    var parseChat = messages;
    var parsedMessage = "";
    var msgType = "";
    var count = parseChat.length;
    for (i = 0; i < count; i++) {
        var temp = parseChat[i].components[0].data.text;
        msgType = parseChat[i].type;
        if (msgType == "incoming") {
            msgType = "User says";
        } else {
            msgType = "Bot says";
        }
        if (!temp.includes("application/vnd.microsoft")) {
            parsedMessage = parsedMessage + msgType + " : " + temp + "\n";
        } else {
            try {
                var temp1 = JSON.parse(parseChat[i].components[0].data.text);
                var parsedMsg = "MS teams template"
                if (temp1.text) {
                    parsedMsg = temp1.text;
                }
                else if (temp1.attachments && temp1.attachments[0].contentType === "application/vnd.microsoft.card.hero") {
                    parsedMsg = temp1.attachments[0].content.text;
                } else {
                    if (temp1.attachments[0] && temp1.attachments[0].content && temp1.attachments[0].content.body) {
                        for (let j = 0; j < temp1.attachments[0].content.body.length; j++) {
                            if (temp1.attachments[0].content.body[j].text) {
                                parsedMsg = temp1.attachments[0].content.text;
                                break;
                            }
                        }
                    }
                }
                parsedMessage = parsedMessage + msgType + " : " + parsedMsg + "\n";
            } catch (err) {
                parsedMessage = parsedMessage + msgType + " : " + temp + "\n";
            }
        }
    }
    return parsedMessage;
}

function getChatHistory(data) {
    return new Promise((resolve, reject) => {
        data.limit = config.custom.chatHistory.chatHistoryLimit;
        sdk.getMessages(data, function (err, resp) {
            if (err) {
                reject(err)
            }
            var messages = resp.messages;
            resolve(messages)
        });
    })
}

function prepareDataObject(data, message, isTemplate = false) {
    var toJSONFunction;
    if (isTemplate) {
        toJSONFunction = function () {
            return {
                __payloadClass: "OnMessagePayload",
                requestId: data.requestId,
                botId: data.botId,
                componentId: data.componentId,
                sendUserMessageUrl: data.sendUserMessageUrl,
                sendBotMessageUrl: data.sendBotMessageUrl,
                context: data.context,
                channel: data.channel,
                overrideMessagePayload: {
                    body: JSON.stringify(message),
                    isTemplate: true
                }
            };
        }
    } else {
        toJSONFunction = function () {
            return {
                __payloadClass: "OnMessagePayload",
                requestId: data.requestId,
                botId: data.botId,
                componentId: data.componentId,
                sendUserMessageUrl: data.sendUserMessageUrl,
                sendBotMessageUrl: data.sendBotMessageUrl,
                context: data.context,
                channel: data.channel,
                message: message
            };
        }
    }
    return toJSONFunction;
}


function getUserDetails(data) {
    var userDetails = {
        "name": "",
        "emailId": ""
    }
    console.log("custom data : " + JSON.stringify(data.context.session.UserContext.customData))
    if (data.context.session.BotUserSession.channels && data.context.session.BotUserSession.channels[0] && data.context.session.BotUserSession.channels[0].client && data.context.session.BotUserSession.channels[0].client === "botbuilder") {
        userDetails.name = `${data.context.session.UserContext.firstName} ${data.context.session.UserContext.lastName}`;
        userDetails.emailId = data.context.session.UserContext.emailId;
    }
    else if (data.context.session.BotUserSession.channels && data.context.session.BotUserSession.channels[0].type === "rtm") {
        //RTM channel is for both serviceow and sharepoint so there is no firstName in sharepoint and we need to get it from the email converstion
        if (data.context.session.UserContext.customData && data.context.session.UserContext.customData.user_info) {
            if (data.context.session.UserContext.customData.user_display_name) {
                //from servicenow
                userDetails.name = data.context.session.UserContext.customData.user_display_name;
            } else {
                //from Share point there is only email id
                userDetails.name = getUserNameFromEmail(data.context.session.UserContext.customData.user_info.user_name);
            }
            userDetails.emailId = data.context.session.UserContext.customData.user_info.user_name;
        }
    } else if (data.context.session.BotUserSession.channels && data.context.session.BotUserSession.channels[0].type === "msteams") {
        if (data.context.session.UserContext.identities[0] && data.context.session.UserContext.identities[0].profileInfo) {
            userDetails.name = data.context.session.UserContext.identities[0].profileInfo.name;
            userDetails.emailId = data.context.session.UserContext.identities[0].profileInfo.email;
        }
    }
    return userDetails;
}


module.exports = {
    botId: botId,
    botName: botName,
    on_user_message: function (requestId, data, callback) {
        console.log(`On User message ::::::> User Id : ${data.context.session.UserContext._id} :: Is agent transfer active : ${data.agent_transfer}`);
        if (!data.agent_transfer) {
            return sdk.sendBotMessage(data, callback);
        } else {
            if (data.message) {
                var visitorId = data.context.session.UserContext._id;
                if (!visitorId) {
                    visitorId = _.get(data, 'channel.from');
                }
                redisOperations.insertRedisWithUserData(visitorId, data);
                var userDetails = getUserDetails(data);
                var action = null;
                data.message = data.message.trim()
                if (data && data.agent_transfer && (data.message.toLowerCase() === "stop chat" || data.message.toLowerCase() === "quit" || data.message.toLowerCase() === "start over")) {
                    data.message = config.servicenow.customMessages.endChatMessage;
                    sdk.sendUserMessage(data, callback);
                    sdk.clearAgentSession(data);
                    data.message = "Please end the chat. Thanks!";
                    redisOperations.deleteRedisData(`${config.redis.keyPrefix}_UserId:${visitorId}`);
                    action = "END_CONVERSATION"
                }
                var requestBody = snowAPI.generateBody(data.context.session.UserContext._id, action, data.context.session.BotUserSession.conversationSessionId, data.message, true, userDetails.name, userDetails.emailId);
                console.log(`In On User Message ::::> Request Id = ${requestBody.requestId} :: Client Session Id = ${requestBody.clientSessionId} :: Email Id = ${requestBody.emailId} :: Sending message to the Agent`);

                return snowAPI.SendMessageToLiveAgent(requestBody, visitorId)
                    .then(function (res) {
                        console.log(`In On User Message ::::> Request Id = ${requestBody.requestId} :: Client Session Id = ${requestBody.clientSessionId} :: Email Id = ${requestBody.emailId} :: Message sent to the Agent :: Response = ${JSON.stringify(res)}`);
                    })
                    .catch(function (e) {
                        console.log("Error in sending messages to snow : ", e.message);
                        sdk.clearAgentSession(data);
                        redisOperations.deleteRedisData(`${config.redis.keyPrefix}_UserId:${visitorId}`);
                        return sdk.sendBotMessage(data, callback);
                    });
            } else {
                console.log(`On User message ::::::> User Id : ${data.context.session.UserContext._id} :: Is agent transfer active : ${data.agent_transfer} :: on connect ${data.message} came`);
                // data.message = config.custom.onConnectDuplicateMsg
                // return sdk.sendUserMessage(data, callback);
            }
        }
    },
    on_bot_message: function (requestId, data, callback) {
        return sdk.sendUserMessage(data, callback);
    },
    on_agent_transfer: function (requestId, data, callback) {
        console.log(`On Agent Transfer ::::::> User Id : ${data.context.session.UserContext._id}`)
        var visitorId = data.context.session.UserContext._id;
        if (!visitorId) visitorId = _.get(data, 'channel.from');
        var userDetails = getUserDetails(data);
        redisOperations.insertRedisWithUserData(visitorId, data);
        sdk.extendRequestId(data);
        var requestBody = snowAPI.generateBody(data.context.session.UserContext._id, "START_CONVERSATION", data.context.session.BotUserSession.conversationSessionId, "live agent support.", true, userDetails.name, userDetails.emailId);
        console.log(`In On Agent Transfer ::::> Request Id = ${requestBody.requestId} :: Client Session Id = ${requestBody.clientSessionId} :: Email Id = ${requestBody.emailId} :: (chat history) = ${JSON.stringify(requestBody)}`);
        snowAPI.CreateChatQueue(requestBody)
            .then(function (res) {
                console.log(`In On Agent Transfer ::::> Request Id = ${requestBody.requestId} :: Client Session Id = ${requestBody.clientSessionId} :: Email Id = ${requestBody.emailId} :: Chat queue is created :: Response = ${JSON.stringify(res)}`);
                return callback(null, data);
            })
            .catch(function (err) {
                console.log("Error in creating the chat queue : ", err);
                data.message = config.servicenow.customMessages.chatCreationFailure;
                sdk.sendUserMessage(data);
                sdk.clearAgentSession(data);
            })
    },

    on_webhook: function (requestId, data, componentName, callback) {
        return callback(null, data);
    },

    on_event: function (requestId, data, callback) {
        return callback(null, data);
    },
    on_alert: function (requestId, data, callback) {
        console.log("on_alert -->  : ", data, data.message);
        return sdk.sendAlertMessage(data, callback);
    },
    //custom route in which messages from snow are received
    sendMessagetoBotUser: function (req) {
        var reqBody = req.body;
        console.log(`In Send Message to Bot User ::::::> Request Id ${reqBody.requestId} :: Client Session Id = ${reqBody.clientSessionId}`);
        redisOperations.getRedisData(`${config.redis.keyPrefix}_UserId:${reqBody.requestId}`).then(function (data) {
            if (data && reqBody.body[0].value) {
                var message = reqBody.body[0].value;
                data.toJSON = prepareDataObject(data, message, false);
                if (message.includes("It seems you have left the conversation") || message.includes("The conversation has ended") || message.includes("has closed the support session") || message.includes("There are no agents") || message.includes("Thank you for using") || message.includes("having technical issues and")) {
                    redisOperations.deleteRedisData(`${config.redis.keyPrefix}_UserId:${reqBody.requestId}`);
                    sdk.clearAgentSession(data);
                } else if (data.context.session.BotUserSession.channels && data.context.session.BotUserSession.channels[0].type === "rtm") {
                    message = {
                        "type": "template",
                        "payload": {
                            "template_type": "live_agent",
                            "text": reqBody.body[0].value
                        }
                    }
                    data.toJSON = prepareDataObject(data, message, true);
                }
                sdk.sendUserMessage(data, function (err, done) {
                    console.log(`In Send Message to Bot User ::::::> Request Id ${reqBody.requestId} :: Client Session Id = ${reqBody.clientSessionId} :: Message sent to the user`);
                }).catch(function (e) {
                    console.log(`In Send Message to Bot User ::::::> Request Id ${reqBody.requestId} :: Client Session Id = ${reqBody.clientSessionId} :: Error while sending message to the user :: Error ${e}`);
                    sdk.clearAgentSession(data);
                    redisOperations.deleteRedisData(`${config.redis.keyPrefix}_UserId:${reqBody.requestId}`);
                });
            }
            else if (data && reqBody.body[0].message && reqBody.body[0].message === "Agent has entered the chat.") {
                var userDetails = getUserDetails(data);
                getChatHistory(data).then(function (messages) {
                    var parsedChatHistory = "";
                    if (messages.length === 0) {
                        parsedChatHistory = config.custom.chatHistory.chatHistoryNotFound
                    } else {
                        if (data.context.session.BotUserSession.channels && data.context.session.BotUserSession.channels[0].type === "msteams") {
                            parsedChatHistory = chatHistoryParserForTeams(messages)
                        } else {
                            parsedChatHistory = chatHistoryParser(messages)
                        }
                    }
                    var requestBody1 = snowAPI.generateBody(data.context.session.UserContext._id, null, data.context.session.BotUserSession.conversationSessionId, parsedChatHistory, true, userDetails.name, userDetails.emailId);
                    console.log(`In Send Message to Bot User ::::> Request Id = ${requestBody1.requestId} :: Client Session Id = ${requestBody1.clientSessionId} :: Email Id = ${requestBody1.emailId} :: Initial send message request (chat history) = ${JSON.stringify(requestBody1)}`);
                    snowAPI.SendMessageToLiveAgent(requestBody1, reqBody.requestId)
                        .then(function (res) {
                            console.log(`In Send Message to Bot User ::::::> Initial message to Agent :: Request Id = ${requestBody1.requestId} :: Client Session Id = ${requestBody1.clientSessionId} :: Email Id = ${requestBody1.emailId} :: Message sent to the Agent :: Response = ${JSON.stringify(res)}`);
                        })
                        .catch(function (err) {
                            console.log("Error in sending messages to snow : ", err);
                            sdk.clearAgentSession(data);
                            redisOperations.deleteRedisData(`${config.redis.keyPrefix}_UserId:${visitorId}`);
                            return sdk.sendBotMessage(data, callback);
                        });
                })
            }
        });
    },
    gethistory: function (req, res) {
        var userId = req.query.userId;
        // redisOperations.getRedisData(`${config.redis.keyPrefix}_UserId:${userId}`).then(function (data) {
        var data = {
            "baseUrl": `${config.custom.chatHistory.host}/api/botsdk/stream/${botId[0]}`,
            "userId": userId
        }
        if (data) {
            getChatHistory(data).then(function (messages) {
                res.status(200);
                return res.json(messages);
            }).catch(function (err) {
                var error = {
                    msg: "Invalid inputs",
                    err: err,
                    code: 400
                };
                res.status(400);
                return res.json(error);
            })
        } else {
            var error = {
                msg: "Invalid user",
                code: 401
            };
            res.status(401);
            return res.json(error);
        }
        // })
    },
    on_client_event: function (requestId, data, callback) {
        console.log("on_client_event ==> ");
        var data2 = _.cloneDeep(data);
        data2.toJSON = function () {
            return {
                __payloadClass: 'OnMessagePayload',
                requestId: data.requestId,
                botId: data.botId,
                componentId: data.componentId,
                sendUserMessageUrl: data.sendUserMessageUrl,
                sendBotMessageUrl: data.sendBotMessageUrl,
                context: data.context,
                channel: data.channel,
                message: "Thank you for using ChatNow."
                // overrideMessagePayload: overrideMessagePayload
            };
        };
        // sdk.sendUserMessage(data2, callback);
    }
};