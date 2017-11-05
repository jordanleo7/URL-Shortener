 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
// Import Mongo DB
var mongodb = require('mongodb').MongoClient;
// Import Mongoose
var mongoose = require('mongoose');
// Regex for URL validation
var urlRegex = /^((https?):\/\/)?([w|W]{3}\.)*[a-zA-Z0-9\-\.]{3,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;



// Set up default mongoose connection
var mongoDB = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;
mongoose.connect(mongoDB, {
  useMongoClient: true
});
// Get the default connection
var db = mongoose.connection;
// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));



// Creating a model
// Define schema
var Schema = mongoose.Schema;

var shortened_url_Schema = new Schema({
    fullUrl: String,
    shortenedUrl: String
});

// Compile model from schema
  var shortened_url_model = mongoose.model('shortened_url', shortened_url_Schema);
// End of Creating a model



// Get user input from URL, query database for duplicate before creating shortened URL
app.get('/new/*', function(req, res) {
  // Save all URL text after /new/ in this var
  var shortened_url_to_create = req.params[0];
  // Check if /new/ URL is valid
  if (urlRegex.test(shortened_url_to_create)) {
    console.log(shortened_url_to_create + ' is valid')
    // If URL is valid, search for existing record in schema
    shortened_url_model.findOne({ fullUrl: shortened_url_to_create }, function (err, matchFound) {
      if (err) return handleError(err);
      // If URL has already been shortened, inform user
      if (matchFound) {
        res.send(shortened_url_to_create + ' shortened url is: ' + matchFound)
      } else {
        // Create new mongodb document for shortened URL 
        var new_instance = new shortened_url_model({ fullUrl: shortened_url_to_create, shortenedUrl: 1234 });
        console.log('New document created');
        res.send(shortened_url_to_create + ' shortened url is: ' + matchFound)
        // Save the new model instance, passing a callback
        new_instance.save(function (err) {
        if (err) return err;
        // saved!
        });
      }
    });
  // If URL is invalid, inform user
  } else {
    console.log(shortened_url_to_create + ' is invalid')
    res.send(shortened_url_to_create + ' is not a valid URL');
  }
}); // close app.get



if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

function handleError (err, req, res, next) {
  res.status(500)
  res.render('error', { error: err })
}

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});
