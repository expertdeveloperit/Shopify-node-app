const dotenv = require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const path = require('path');
const mongoose = require('mongoose');
const cron = require('node-cron');
const router = express.Router();
//settings
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const mongo_db = process.env.SHOPIFY_MONGO_DB;
const shopifyAppModel = require('./../models/shopify_app');
const scopes = 'read_content,write_content,read_themes,write_themes';
const forwardingAddress = "http://165.227.177.203:3000"; // Replace this with your HTTPS Forwarding address

//middleware
function middleware(req, res, next) {
  var params = req.query;
  const message = Object.keys(params).
    filter(key => ['hmac', 'signature'].indexOf(key) === -1).
    map(key => {
        const value = decodeURIComponent(params[key]).
            replace(/\%/g, '%25' ).
            replace(/\&/g, '%26' ).
            replace(/\=/g, '%3D' );
        return `${key}=${value}`;
    }).
    sort().join('&');

    const digest = crypto.
      createHmac('SHA256', apiSecret).
      update(message).
      digest('hex');
    if(digest === params.hmac){
      next()
    }else{
      return res.status(401).send("Unauthorized User.");
    } 
}

router.get('/', (req, res) => {
  res.render('pages/index',{
    render:false,
    forwardingAddress
  });
});


router.get('/store', (req, res) => {
  let shop = req.query.shop.trim();
  shop = shop.replace('http://','').replace('https://','').split(/[/?#]/)[0];

  console.log(shop,"shop");
  if (shop) {
    const state = nonce();
    const redirectUri = forwardingAddress + '/store/callback';
    const installUrl = 'https://' + shop +
      '/admin/oauth/authorize?client_id=' + apiKey +
      '&scope=' + scopes +
      '&state=' + state +
      '&redirect_uri=' + redirectUri;

    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
  }
});

router.get('/app', (req, res) => {
    res.render('pages/settings');
});

router.get('/settings',middleware, (req, res, next) => {
    var params = req.query;
    shopifyAppModel.forder-tracking-app.myshopify.comindOne({'storeInfo.domain':params.shop},'status page_handle date_format',function (err, data) {
      if(err){ 
        return res.status(400).send({status:false,data:"Settings not found."});
      }
      
      return res.status(200).send({status:true,data});
      

    });
});

router.post('/settings/update',middleware, (req, res, next) => {
  console.log(req.query.shop);
  var status = false;
  if(req.body.status){
    status = true
  }
  var data = {date_format:req.body.date_format,status,page_handle:req.body.page_handle};

  if(req.body.updateHandle){
    shopifyAppModel.findOne({'storeInfo.domain':req.query.shop},function (err, store) {
      if(!err && store){
        console.log(typeof store,store.date_format);
            const accessToken = store.storeInfo.accessToken ;
            const shopRequestUrl = `https://`+store.storeInfo.domain+`/admin/pages/${store.page_id}.json`;
            const shopRequestHeaders = {
              'X-Shopify-Access-Token': accessToken,
            };
            const body = {
              "page": {
                "id": store.page_id,
                "handle": req.body.page_handle
              }
            };
            console.log("url",shopRequestUrl);
            request.put({url:shopRequestUrl, headers:shopRequestHeaders, form:body})
            .then((shopResponse) => {
                               
            })
            .catch((err) => {
              return res.status(301).send({status:true,msg:err});
            });
      }
    });
  }

  shopifyAppModel.findOneAndUpdate({'storeInfo.domain':req.query.shop},data,function (err, data) {
    if(err){
      return res.render('pages/index',{
        err:err,
        status:false,
        render:true,
        forwardingAddress
      });
    }
  });

  return res.status(200).send({status:true,msg:"Data has been updated successfully."});
});

router.get('/store/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.render('pages/index',{
      err:"Request origin cannot be verified",
      status:false,
      render:true,
      forwardingAddress
    });
    //return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
      );
    let hashEquals = false;
    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.render('pages/index',{
        err:"HMAC validation failed, Please try again.",
        status:false,
        render:true,
        forwardingAddress
      });
      //return res.status(400).send('HMAC validation failed');
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
      const accessToken = accessTokenResponse.access_token;

      const shopRequestUrl = 'https://' + shop + '/admin/shop.json';
      const shopRequestHeaders = {
        'X-Shopify-Access-Token': accessToken,
      };

      request.get(shopRequestUrl, { headers: shopRequestHeaders })
      .then((shopResponse) => {
        

        var data = JSON.parse(shopResponse);
        var storeInfo = data.shop;
        storeInfo.accessToken = accessToken;
        storeInfo.hmac = hmac;
        storeInfo.store_id = storeInfo.id;

        shopifyAppModel.findOneAndUpdate({'storeInfo.id':storeInfo.id},{storeInfo},function (err, data) {
          if(err){
            return res.render('pages/index',{
              err:err,
              status:false,
              render:true,
              forwardingAddress
            });
          }
          if(!err && !data){
            var newObj={};
            newObj.storeInfo = storeInfo;
            newObj.settings = false;
            newObj.page_status = false;
            newObj.insert_script = false;
            newObj.status = true;
            newObj.date_format = 'YYYY-MM-DD';
            var newShop = new shopifyAppModel(newObj);
            newShop.save(function(err1,data1){
              if(err1){
                return res.render('pages/index',{
                  err:err1,
                  status:false,
                  render:true,
                  forwardingAddress
                });
              }
            });
          }
        });

        return res.render('pages/index',{
          url:'https://'+shop,
          status:true,
          render:true,
          forwardingAddress
        });
        //return res.redirect('https://'+shop);
        //return res.status(200).end(shopResponse);

      })
      .catch((error) => {
        return res.render('pages/index',{
          err:error,
          status:false,
          render:true,
          forwardingAddress
        });
        //res.status(error.statusCode).send(error.error.error_description);
      });

      
      
    })
    .catch((error) => {
       return res.render('pages/index',{
          err:error,
          status:false,
          render:true,
          forwardingAddress
        });
      //res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
     return res.render('pages/index',{
          err:'Required parameters missing',
          status:false,
          render:true,
          forwardingAddress
        });
    //res.status(400).send('Required parameters missing');
  }
});






module.exports = router;