/* eslint-disable max-lines-per-function */
"use strict";
const mongo = require("mongodb").MongoClient;
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const util = require("util");
const sendButtonMessage = require("./sendButtion");
const app = express();
var rp = require("request-promise");
require("dotenv").config();
const checkMessageAndSend = require("./send");
// eslint-disable-next-line no-undef
app.set("port", process.env.PORT || 8000);
const vtoken = "thisisarandomtringsaharukh";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//mongoDB
function addUserToDB(sender) {
  var options = {
    uri: `https://graph.facebook.com/${sender}`,
    qs: {
      fields: "name",
      access_token: token,
    },

    json: true,
  };
  // eslint-disable-next-line no-undef
  var mLabUri = process.env.DB_URL;

  mongo.connect(mLabUri, function (err, client) {
    if (err) {
      console.log(err);
      //  res.end(err);
    } else {
      // eslint-disable-next-line no-undef
      var db = client.db(process.env.DB_NAME);
      db.collection("recipients").findOne(
        {
          sender: sender,
        },
        function (err, result) {
          if (result === null) {
            // User not find; adding now
            rp(options).then((res) => {
              console.log(res.name);
              var data = {
                sender: sender,
                name: res.name,
              };
              db.collection("recipients").insertOne(data, function (err, res) {
                if (err) {
                  console.log(err);
                }
                if (res) {
                  sendButtonMessage(
                    sender,
                    `এখন থেকে কোনও নোটিস পোস্ট করা হলে ৫ মিনিটের মধ্যে আপনারে জানিয়ে দেবো । আমি সারাদিন বসে বসে নোটিস চেক করি 😆 । যেকোন সময় নোটিফিকেশন বন্ধ করতে 'stop' লিখে ম্যাসেজ করুন । 
                    
                    ধন্যবাদ`,
                    [
                      {
                        type: "web_url",
                        title: "এখন কি কি নোটিস আছে?",
                        url: "https://www.aiub.edu/category/notices",
                      },
                      {
                        type: "web_url",
                        title: "অ্যাডমিনের প্রোফাইল",
                        url: "https://fb.com/imSaharukh",
                      },
                    ],
                    "RESPONSE"
                  );
                  console.log(res);
                }
                client.close();
              });
            });
          } else {
            // Found user
            sendTextMessage(sender, "ইতিমধ্যে অ্যাক্টিভ করা রয়েছে");
            client.close();
          }
        }
      );
    }
  });
}
function removeUserFromDB(sender) {
  // eslint-disable-next-line no-undef
  var mLabUri = process.env.DB_URL;
  mongo.connect(mLabUri, function (err, client) {
    // eslint-disable-next-line no-undef
    var db = client.db(process.env.DB_NAME);
    if (err) {
      console.log(err);
      //  res.end(err);
    } else
      db.collection("recipients").deleteOne({ sender: sender }, function (
        err,
        res
      ) {
        if (err) {
          console.log(err);
        }
        if (res) {
          console.log(res);
          sendTextMessage(
            sender,
            "সফল ভাবে আনসাবস্ক্রাইব করা হয়েছে যেকন সময় আবার সাবস্ক্রাইব করতে 'start' লিখে ম্যাসেজ করুন "
          );
        }
        client.close();
      });
  });
}
// Home
app.get("/", function (req, res) {
  res.send("Hello world!");
});
//bot
app.get("/mybot", function (req, res) {
  if (req.query["hub.verify_token"] === vtoken) {
    res.send(req.query["hub.challenge"]);
  } else res.send("Wrong token!");
});

// eslint-disable-next-line no-undef
const token = process.env.FB_TOKEN;

app.post("/mybot/", function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  for (var i = 0; i < messaging_events.length; i++) {
    var event = req.body.entry[0].messaging[i];
    var sender = event.sender.id;

    if (event.postback && event.postback.title === "Get Started") {
      sendButtonMessage(
        sender,
        "ইহা একটি চ্যাট বট। AIUB.EDU এ কোনো নোটিস পোস্ট করা হলে এই বট ৫ মিনিটের মধ্যে আপনাকে জানিয়ে দিতে পারবে। আপনি কি এটি অ্যাক্টিভ করেতে চান?",
        [
          {
            type: "postback",
            title: "একটিভ করুন",
            payload: "activeBot",
          },
          {
            type: "postback",
            title: "না ধন্যবাদ",
            payload: "noBot",
          },
        ],
        "RESPONSE"
      );
    } else if (event.postback && event.postback.payload === "activeBot") {
      console.log("activebot called");
      addUserToDB(sender);
    }
    if (event.message && event.message.text) {
      var text = event.message.text.toLowerCase();
      if (text === "start" || text === "add") {
        addUserToDB(sender);
      } else if (text === "stop" || text === "remove") {
        removeUserFromDB(sender);
      } else {
        sendButtonMessage(
          sender,
          "আমি একটি চ্যাট বট। AIUB.EDU এ কোনো নোটিস পোস্ট করা হলে এই বট ৫ মিনিটের মধ্যে আপনাকে জানিয়ে দিতে পারবো। এক্টিভ করতে যে কোন সময় 'start'  এবং ডিএক্টিভ করতে 'stop' লিখে ম্যাসেজ করুন \n ধন্যবাদ  ",
          [
            {
              type: "web_url",
              title: "নতুন ফিচার রিকুয়েস্ট বা আইদিয়া দিন",
              url: "https://github.com/imSaharukh/AIUB-NOTICE-BOT/issues",
            },
            {
              type: "web_url",
              title: "অ্যাডমিন / ডেভেলপারের সাথে কথা বলুন",
              url: "https://facebook.com/imSaharukh",
            },
          ],
          "RESPONSE"
        );
        console.log(`event  ${event.sender}`);
      }
    }
    console.log(util.inspect(event, false, null, true));
  }
  //console.log(util.inspect(req, false, null, true));
  res.sendStatus(200);
});

function sendTextMessage(sender, text) {
  var messageData = {
    text: text,
  };
  request(
    {
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: {
        access_token: token,
      },
      method: "POST",
      json: {
        recipient: {
          id: sender,
        },
        message: messageData,
        tag: "NON_PROMOTIONAL_SUBSCRIPTION",
      },
    },
    function (error, response) {
      if (error) {
        console.log("Error:", error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    }
  );
}
//send Buttion

//get qouts

// //
checkMessageAndSend();
setInterval(checkMessageAndSend, 600000);

// Start the server
app.listen(app.get("port"), function () {
  console.log("running on port", app.get("port"));
});
