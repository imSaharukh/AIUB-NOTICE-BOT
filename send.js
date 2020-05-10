/* eslint-disable no-loop-func */
/* eslint-disable multiline-comment-style */
/* eslint-disable max-depth */
/* eslint-disable func-style */
"use strict";
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const fss = require("fs");
const mongo = require("mongodb").MongoClient;
require("dotenv").config();
const sendButtonMessage = require("./sendButtion");
var changeNotice = [];
var z = 0;
var keyVal = [];
//express installed

// eslint-disable-next-line func-style
// eslint-disable-next-line max-lines-per-function
var checkMessageAndSend = async function () {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    // eslint-disable-next-line function-paren-newline
    await page.goto(
      "https://www.aiub.edu/category/notices?pageNo=1&pageSize=20"
      // eslint-disable-next-line function-paren-newline
    );
    //await page.screenshot({ path: 'example.png' });

    const titles = await page.evaluate(() => {
      const titleFromAIUB = document.querySelectorAll(".title");
      const titleList = [...titleFromAIUB];

      return titleList.map((h) => h.innerText);
    });
    const links = await page.evaluate(() => {
      const linkFromAIUB = document.querySelectorAll(".info-link");
      const linkList = [...linkFromAIUB];

      return linkList.map((h) => h.href);
    });
    const date = await page.evaluate(() => {
      const dateFromAIUB = document.querySelectorAll(".event-list>li>time");
      const dateList = [...dateFromAIUB];

      return dateList.map((h) => h.innerText.split("\n").join(" "));
    });

    for (var i = 0; i < 20; i++) {
      // eslint-disable-next-line object-property-newline
      keyVal.push({ date: date[i], title: titles[i], link: links[i] });
    }

    // console.log(keyVal);
    // eslint-disable-next-line no-sync
    if (fss.existsSync("notice.json")) {
      try {
        var notice = await fs.readFile("notice.json", "utf8");
        // newNotice = await fs.readFile("new.json", "utf8");
        changeNotice = keyVal.filter(function (objFromA) {
          return !JSON.parse(notice).find(function (objFromB) {
            return objFromA.title === objFromB.title;
          });
        });
        console.log(`length of  c ${changeNotice.length}`);
        console.log(`Changed Notice = ${changeNotice}`);
        console.log(`from web Notice = ${keyVal}`);
        console.log(`from local Notice = ${JSON.parse(notice)}`);
        if (changeNotice.length > 0) {
          for (z = 0; z < changeNotice.length; z++) {
            // eslint-disable-next-line multiline-comment-style
            somdata(z);
            fs.writeFile("notice.json", JSON.stringify(keyVal), function (err) {
              if (err) {
                console.log(err);
              }
            });
          }
        } else {
          console.log("no new notice");
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log("File not found so new 'notice.json' file created!");
      fs.writeFile("notice.json", JSON.stringify(keyVal), function (err) {
        if (err) {
          console.log(err);
        }
      });
    }
    await browser.close();
  } catch (error) {
    console.log(`network error ${error}`);
    await browser.close();
  }
};

// eslint-disable-next-line no-undef
var mLabUri = process.env.DB_URL;
function somdata(noticeNumber) {
  mongo.connect(mLabUri, function (err, client) {
    if (err) {
      console.log(err);
      //res.end(err);
      throw err;
    } else {
      // eslint-disable-next-line no-undef
      var db = client.db(process.env.DB_NAME);
      db.collection("recipients")
        .find()
        .toArray(function (err, docs) {
          if (err) {
            console.log(err);
          }
          for (var i = 0; i < docs.length; i++) {
            console.log("value of z inside the second loop", z);
            sendButtonMessage(
              docs[i].sender,
              ` ${changeNotice[noticeNumber].date}   \n\n${changeNotice[noticeNumber].title}`,
              [
                {
                  type: "web_url",
                  title: "সম্পুর্ন নোটিশ",
                  url: changeNotice[noticeNumber].link,
                },
              ],
              "MESSAGE_TAG"
            );
          }
          client.close();
        });
    }
  });
}
//checkMessageAndSend();
module.exports = checkMessageAndSend;
