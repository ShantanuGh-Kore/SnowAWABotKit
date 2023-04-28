var BasePayload = require('./BasePayload.js');
var util = require('util');

function OnlinkEventPayload(requestId, botId, componentId, opts) {
    BasePayload.call(this, requestId, botId, componentId);
    this.payloadClassName   = 'OnlinkEventPayload';
    this._originalPayload   = opts;
    this.getBotVariableUrl  = opts.getBotVariableUrl;
    var sendUserMessageUrl  = opts.sendUserMessageUrl;
    this.sendUserMessageUrl = sendUserMessageUrl;
    var sendBotMessageUrl   = opts.sendBotMessageUrl;
    this.sendBotMessageUrl  = sendBotMessageUrl;
    var sendBotEventUrl     = opts.sendBotEventUrl;
    this.sendBotEventUrl    = sendBotEventUrl;
    this.resetBotUrl        = opts.resetBotUrl;
    this.baseUrl            = opts.baseUrl;
    this.metaInfo           = opts.metaInfo;
    this.context            = opts.context;
    this.channel            = opts.channel;
    this.agent_transfer     = opts.agent_transfer || false;
    this.ackMessage         = true;
    this.preDefinedEvent    = opts.preDefinedEvent;
    this.customEvent        = opts.customEvent;
    this.toJSON             = function () {
        return {
            __payloadClass      : 'OnlinkEventPayload',
            requestId           : requestId,
            botId               : botId,
            componentId         : componentId,
            sendUserMessageUrl  : sendUserMessageUrl,
            sendBotMessageUrl   : sendBotMessageUrl,
            sendBotEventUrl     : sendBotEventUrl,
            getBotVariableUrl   : this.getBotVariableUrl,
            context             : this.context,
            channel             : this.channel,
            agent_transfer      : this.agent_transfer,
            baseUrl             : this.baseUrl,
            metaInfo            : this.metaInfo,
            ackMessage          : this.ackMessage,
            preDefinedEvent     : this.preDefinedEvent,
            customEvent         : this.customEvent
        };
    };
}

util.inherits(OnlinkEventPayload, BasePayload);

module.exports = OnlinkEventPayload;
