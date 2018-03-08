"use strict";

var express = require("express");
var fs = require("fs");
var util = require("util");
var mime = require("mime");
var multer = require("multer");
var upload = multer({ dest: "uploads/" });

// Set up auth
var gcloud = require("@google-cloud/vision");

var vision = new gcloud.ImageAnnotatorClient({
  keyFilename: "./key.json",
  projectId: "mandalalabs-197308"
});

var app = express();

// Simple upload form
var form =
  "<!DOCTYPE HTML><html><body>" +
  "<form method='post' action='/upload' enctype='multipart/form-data'>" +
  "<input type='file' name='image'/>" +
  "<input type='submit' /></form>" +
  "</body></html>";

app.get("/", function(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/html"
  });
  res.end(form);
});

// Get the uploaded image
// Image is uploaded to req.file.path
app.post("/upload", upload.single("image"), function(req, res, next) {
  // Choose what the Vision API should detect
  // Choices are: faces, landmarks, labels, logos, properties, safeSearch, texts
  var type = "labels";

  // Send the image to the Cloud Vision API
  vision
    .textDetection("./" + req.file.destination + req.file.filename)
    .then(results => {
      const labels = results[0].textAnnotations;

      var result = [];
      labels.forEach(label => result.push(label.description));

      res.send(JSON.stringify(result));
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
});

app.listen(8080);
console.log("Server Started");

// Turn image into Base64 so we can display it easily

function base64Image(src) {
  var data = fs.readFileSync(src).toString("base64");
  return util.format("data:%s;base64,%s", mime.lookup(src), data);
}
