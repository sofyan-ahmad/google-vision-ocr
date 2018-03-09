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
  projectId: "<PROJECT_ID>"
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
      results = results[0].textAnnotations;

      results.forEach(result => {
        result.confidence = undefined;
        result.searchConfidence = [
          {
            text: "searchedtext1",
            level: "unimplemented"
          },
          {
            text: "searchedtext2",
            level: "unimplemented"
          }
        ];

        result.locations = undefined;
        result.geoTaging = "Jakarta, Indonesia";

        result.properties = undefined;

        result.text = result.description;
        result.description = undefined;

        result.__poly = result.boundingPoly;
        result.boundingPoly = undefined;
      });

      results = {
        fraudProximity: [
          {
            id: "UUID",
            file: "htt://notimplemented",
            percentage: 0
          }
        ],
        analyticResult: [
          {
            products: [
              {
                id: "UUID",
                productName: "notimplemented",
                amount: "notimplemented",
                price: 0.0
              }
            ],
            storeData: {}
          }
        ],
        metaText: results
      };

      res.send(JSON.stringify(results));
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
