const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const path = require('path');
const bodyParser = require('body-parser')
const cron = require('node-cron');
const mongoose = require('mongoose');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
const shopifyAppModel = require('./src/models/shopify_app');

const shopifyApi = require('./src/routes/shopify-api');
const cronJob = require('./src/routes/cron-job');

//settings
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const mongo_db = process.env.SHOPIFY_MONGO_DB;
const scopes = 'read_content,write_content,read_themes,write_themes';
const forwardingAddress = "https://shopify-track-nodejs.herokuapp.com"; // Replace this with your HTTPS Forwarding address

// cron.schedule('* */1 * * *', function(){
//   cronJob.setupSettings();
// });

mongoose.connect(mongo_db,function(err){
  if(err){
    return "mongo DB connection failed";
  }
  console.log("Connection Established");
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Example app listening on port 3000!');
});



app.use(shopifyApi);


//cron job to setup setting when app is installed 
cron.schedule('* */1 * * *', function(){
  shopifyAppModel.find({page_status:false},function (err, data) {
    if(err){
      console.log(err);
    }else{
      data.forEach(function(store){
        if(!store.page_status){
          cronJob.CreatePage(store);  
        }
      });
    }
  });
   shopifyAppModel.find({insert_script:false},function (err, data) {
    if(err){
      console.log(err);
    }else{
      data.forEach(function(store){
        if(!store.insert_script){
          cronJob.insertScriptIntoTheme(store);
        }  
      });
    }
  });
});





















// app.get('/page', (req, res) => {
	
	
// 	// const accessToken ='79d5ee30c4ad75419ff3b686e354d65b' ;
//  //      const shopRequestUrl = 'https://order-tracking-app.myshopify.com/admin/pages.json';
//  //      const shopRequestHeaders = {
//  //        'X-Shopify-Access-Token': accessToken,
//  //      };
//  //  	const body = {
// 	//   "page": {
// 	//     "title": "Order Tracking",
// 	//     "body_html": "<div id='orderTracking'></div>"
// 	//   }
// 	// };
//  //  //to create pages
// 	//  request.post({url:shopRequestUrl, headers:shopRequestHeaders, form:body})
//  //      .then((shopResponse) => {
//  //      	console.log(shopResponse);
//  //        res.status(200).end(shopResponse);
//  //      })
//  //      .catch((error) => {
//  //      	console.log(error);
//  //        res.status(error.statusCode).send(error.error.error_description);
//  //      });
//  // end here

//   const accessToken ='79d5ee30c4ad75419ff3b686e354d65b' ;
//       const shopRequestUrl = 'https://order-tracking-app.myshopify.com/admin/themes.json';
//       const shopRequestHeaders = {
//         'X-Shopify-Access-Token': accessToken,
//       };
//     request.get(shopRequestUrl,{headers:shopRequestHeaders})
//       .then((shopResponse) => {
//       var respo = JSON.parse(shopResponse);
//        respo.themes.forEach(function(theme){
//         if(theme.role === 'main'){
//           console.log(theme.id,"themes");
//           themeId = theme.id;
//           return false;
//         }
//        });


//        console.log(themeId,"themeId");
//        let url = `https://order-tracking-app.myshopify.com/admin/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid&theme_id=${themeId}`;
//        console.log("url",url);
//           request.get(url,{headers:shopRequestHeaders})
//           .then((shopResponse) => {
//               //console.log(shopResponse,"jjj");

//               var data = JSON.parse(shopResponse);
//               var html = data.asset.value;
//               html = html.replace("</body>",'<script src="https://quiet-sea-17233.herokuapp.com/static/js/bundle.js"></script></body>');
//               const shopRequestUrl = `https://order-tracking-app.myshopify.com/admin/themes/${themeId}/assets.json`;
//               var body = {
//                 "asset": {
//                   "key": "layout/theme.liquid",
//                   "value": html
//                 }
//               };
//               console.log("shopRequestUrl",shopRequestUrl);
//               request.put({url:shopRequestUrl, headers:shopRequestHeaders, form:body})
//               .then((shopResponse) => {
//                console.log(shopResponse);
//                 res.status(200).end(shopResponse);
//               })
//               .catch((error) => {
//                console.log(error);
//                 res.status(error.statusCode).send(error.error.error_description);
//               });
              

//               //res.status(200).json(html);
//           }).catch((error) => {
//            console.log(error);
//             res.status(error.statusCode).send(error);
//           });


//         //res.status(200).json(themeId);
//       })
//       .catch((error) => {
//        console.log(error);
//         res.status(error.statusCode).send(error);
//       });

// });

