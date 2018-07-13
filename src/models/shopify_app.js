const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shopifyApp = new Schema({
	shop_url:  String,
	hmac: String,
	access_token:String,
	storeInfo: Object,
	date_format:String,
	insert_script:Boolean,
	status:Boolean,	
	page_handle:String,	
	page_id:String,	
	page_status:Boolean,	
	settings:Boolean,	
},{ strict: false  });

var shopifyAppModel = mongoose.model('shopifyApp', shopifyApp );
module.exports = shopifyAppModel;
