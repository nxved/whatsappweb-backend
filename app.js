const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const { Client, NoAuth } = require("whatsapp-web.js");
const fs = require("fs");
const app = express();
const qrcode = require("qrcode-terminal");
const cors = require("cors"); // Import the cors package

require("dotenv").config();

app.use(cors());
app.use(express.json());

const SESSION_FILE_PATH = "./session.json";

let accountCount;
let receivedMsgCount;
let sendMsgCount;

let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: { headless: true },
  authStrategy: new NoAuth(),
});

client.initialize();

// Add this after express code but before starting the server

client.on("qr", (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED", qr);
  //  qrcode.generate(qr, { small: true }); // Add this line
  app.get("/getqr", (req, res, next) => {
    res.send({ qr });
  });
});

// client.on('authenticated', session => {
//   console.log('AUTHENTICATED', session);
//   sessionCfg = session;
//   fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
//     if (err) {
//       console.error(err);
//     }
//   });
// });

// client.on('auth_failure', msg => {
//   // Fired if session restore was unsuccessfull
//   console.error('AUTHENTICATION FAILURE', msg);
// });

client.on("ready", (ready) => {
  console.log(ready);
  accountCount = 1;
  app.get("/checkready", (req, res, next) => {
    res.send({ ready });
  });
});

app.post("/sendmessage", async (req, res, next) => {
  try {
    const { number, message } = req.body; // Get the body
    if (client.info === undefined) {
      console.log("the system is not ready yet");
    } else {
      const msg = await client.sendMessage(`${number}@c.us`, message); // Send the message
      sendMsgCount++;
      res.send({ msg });
    } // Send the response
  } catch (error) {
    next(error);
  }
});

client.on("message", (message) => {
  console.log(message.body);
  if (message.type === "chat") {
    receivedMsgCount++;
  };
  console.log(message);
  app.get("/getmessage", (req, res, next) => {
    if (message.type === "chat") {
      res.send({ message });
    }
  });
});

app.get("/count", (req, res, next) => {
  res.send({ accountCount , receivedMsgCount , sendMsgCount });
});


// Listening for the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
