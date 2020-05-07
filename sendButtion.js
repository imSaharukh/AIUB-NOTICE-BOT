/* eslint-disable max-lines-per-function */
/* eslint-disable max-params */
/* eslint-disable func-style */
"use strict";
const request = require("request");
// eslint-disable-next-line no-undef
const token = process.env.FB_TOKEN;
var sendButtonMessage = function (sender, text, buttons, type) {
  var json = "";
  if (type === "RESPONSE") {
    json = {
      recipient: {
        id: sender,
      },
      messaging_type: type,
      message: {
        attachment: {
          type: "template",
          //[{type},{title},{payload}]
          payload: {
            template_type: "button",
            text: text,
            buttons: buttons,
          },
        },
      },
    };
  } else if (type === "MESSAGE_TAG") {
    json = {
      recipient: {
        id: sender,
      },
      messaging_type: type,
      message: {
        attachment: {
          type: "template",
          //[{type},{title},{payload}]
          payload: {
            template_type: "button",
            text: text,
            buttons: buttons,
          },
        },
      },
      tag: "CONFIRMED_EVENT_UPDATE",
    };
  }
  request(
    {
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: {
        access_token: token,
      },
      method: "POST",
      json: json,
    },
    function (error, response) {
      if (error) {
        console.log("Error:", error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    }
  );
};
module.exports = sendButtonMessage;
