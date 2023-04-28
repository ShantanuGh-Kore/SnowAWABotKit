var config = {
  "server": {
    "port": 8003
  },
  "app": {
    "apiPrefix": "/botkit",
    "url": ""
  },
  "credentials": {
    "<BotId>": {
      "apikey": "<client secret>",
      "appId": "<client ID>"
    }
  },
  "servicenow": {
    "host": "https://<SNOW host>.service-now.com",
    "userId": "<service account user id>",
    "authorization": "<Basic auth token for the SNow service account>",
    "clientMessageId": "HBC-467",
    "customMessages": {
      "chatCreationFailure": "I am sorry! I am unable to initiate chat with the Agent at this moment. Please try again by reloading the page",
      "sendMessageFailure": "I am sorry! I am unable to send message to the Agent at this moment. Please try again after some time",
      "endChatMessage": "Ok, the conversation with the Agent has been stopped. You can continue chatting with the bot."
    }
  },
  "redis": {
    "options": {
      "host": "localhost",
      "port": 6379
    },
    "available": true,
    "keyPrefix": "BOTKIT_DEV"
  },
  "examples": {
    "mockServicesHost": "http://localhost:8004"
  },
  "liveagentlicense": "8947569",
  "supportsMessageAck": true,
  "languages": [
    "en",
    "de"
  ],
  "custom": {
    "emailRegex": /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\.([a-zA-Z0-9_-]+)/,
    ///([a-zA-Z0-9._-]+)\.([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\.([a-zA-Z0-9_-]+)/
    "onConnectDuplicateMsg": "It seems you are already having a conversation with agent. Please continue to chat here.",
    "chatHistory": {
      "chatHistoryLimit": 10,
      "host": "https://bots.kore.ai",
      "chatHistoryNotFound": "I am not able to find any chat for this user."
    },
    "jwePublicKey": "<jwe public key from Bot Builder APP>",
    "startoverConfig": {
      "words": ["start over", "startover", "discard all"],
      "message": {
        "websdk": {
          "type": "template",
          "payload": {
            "template_type": "button",
            "text": "Ok, I am discarding the task for now.\nI can help with your HR and IT related questions. What would you like to get started with:",
            "subText": "Button Template Description",
            "buttons": [
              {
                "type": "postback",
                "title": "Human Resources",
                "payload": "WelcomeHROtsuka"
              },
              {
                "type": "postback",
                "title": "IT Service Desk",
                "payload": "IT Help Desk"
              }
            ]
          }
        },
        "msteams": {
          "type": "message",
          "speak": "",
          "text": "",
          "attachments": [
            {
              "contentType": "application/vnd.microsoft.card.hero",
              "content": {
                "text": "Ok, I am discarding the task for now.\nI can help with your HR and IT related questions. What would you like to get started with:",
                "buttons": [
                  {
                    "type": "messageBack",
                    "title": "Human Resources",
                    "displayText": "Human Resources",
                    "text": "WelcomeHROtsuka"
                  },
                  {
                    "type": "messageBack",
                    "title": "IT Service Desk",
                    "displayText": "IT Service Desk",
                    "text": "IT Help Desk"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
}

module.exports = config