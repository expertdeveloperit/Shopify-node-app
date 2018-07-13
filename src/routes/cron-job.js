const dotenv = require('dotenv').config();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const path = require('path');
const mongoose = require('mongoose');
const cron = require('node-cron');

//settings
const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const mongo_db = process.env.SHOPIFY_MONGO_DB;
const shopifyAppModel = require('./../models/shopify_app');

const allfuntion = module.exports  = {
		
	errorSaveDb(store,err){
		shopifyAppModel.findOneAndUpdate({'storeInfo.id':store.storeInfo.id},{error:err},function (err, data) {
	        return true;
	    });
	},

	//create page into shopify
	CreatePage(store){
	    const accessToken = store.storeInfo.accessToken ;
	    const shopRequestUrl = 'https://'+store.storeInfo.domain+'/admin/pages.json';
	    const shopRequestHeaders = {
	      'X-Shopify-Access-Token': accessToken,
	    };
	    const body = {
	      "page": {
	        "title": "Order Tracking",
	        "body_html": "<div id='orderTrackingApp'></div>"
	      }
	    };

	    request.post({url:shopRequestUrl, headers:shopRequestHeaders, form:body})
	    .then((shopResponse) => {
	      var respo = JSON.parse(shopResponse);
	      var page_id = respo.page.id;
	      var page_handle = respo.page.handle;
	      shopifyAppModel.findOneAndUpdate({'storeInfo.id':store.storeInfo.id},{page_status:true,page_id,page_handle},function (err, data) {
	            if(err){
	              allfuntion.errorSaveDb(store,err);
	            }
	            return true;
	      });
	    })
	    .catch((err) => {
	      allfuntion.errorSaveDb(store,err);
	    });

	},
	//insert script into theme
	insertScriptIntoTheme(store){
	    const shopRequestUrl = 'https://'+store.storeInfo.domain+'/admin/themes.json';
	    const accessToken = store.storeInfo.accessToken ;
	    const shopRequestHeaders = {
	      'X-Shopify-Access-Token': accessToken,
	    };

	    let themeId = '';
	    request.get(shopRequestUrl,{headers:shopRequestHeaders})
	    .then((shopResponse) => {
	        var respo = JSON.parse(shopResponse);
	        respo.themes.forEach(function(theme){
	          if(theme.role === 'main'){              
	            themeId = theme.id;
	            return false;
	          }
	        });
	        console.log("themeid",themeId);
	        if(themeId){
	            let url = `https://`+store.storeInfo.domain+`/admin/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid&theme_id=${themeId}`;
	              request.get(url,{headers:shopRequestHeaders})
	                .then((shopResponse) => {
	                    var data = JSON.parse(shopResponse);
	                    var html = data.asset.value;
	                    var substring = 'static/js/bundle.js';
	                    console.log(html.indexOf(substring),"indexof");
	                    if(html.indexOf(substring) < 0){
	                        html = html.replace("</body>",'<script src="https://shopify-track-order.herokuapp.com/static/js/bundle.js"></script></body>');
	                        html = html.replace("</head>",'<link rel="stylesheet" href="https://shopify-track-order.herokuapp.com/css/style.css"></head>');
	                        const shopRequestUrl = `https://`+store.storeInfo.domain+`/admin/themes/${themeId}/assets.json`;
	                        var body = {
	                          "asset": {
	                            "key": "layout/theme.liquid",
	                            "value": html
	                          }
	                        };
	                        //console.log("make changes",html);
	                        console.log("shopRequestHeaders",shopRequestHeaders);
	                        request.put({url:shopRequestUrl, headers:shopRequestHeaders, form:body})
	                        .then((shopResponse) => {
	                           console.log("err",shopResponse);
	                         shopifyAppModel.findOneAndUpdate({'storeInfo.id':store.storeInfo.id},{insert_script:true},function (err, data) {
	                            if(err){
	                              allfuntion.errorSaveDb(store,err);
	                            }
	                            console.log(shopResponse,"shopResponse");
	                            return true;
	                          });
	                          
	                        })
	                        .catch((err) => {
	                        	console.log("eeeeee",err);
	                          allfuntion.errorSaveDb(store,err);
	                        });
	                    }else{
	                    	shopifyAppModel.findOneAndUpdate({'storeInfo.id':store.storeInfo.id},{insert_script:true},function (err, data) {
	                            if(err){
	                              allfuntion.errorSaveDb(store,err);
	                            }
	                            return true;
	                        });
	                    }
	                    
	                }).catch((err) => {
	                  allfuntion.errorSaveDb(store,err);		                  
	                });
	        }else{
	          allfuntion.errorSaveDb(store,"Theme Id not found.");
	        }
	    })
	    .catch((err) => {
	      allfuntion.errorSaveDb(store,err);
	    });    
	}
}