import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import $ from "jquery";
import axios from 'axios'
var URL = require('url-parse');

class App extends Component {
  constructor(){
    super();
    this.state = {
      screen1:true,
      orderData:{},
      errMsg:"",
      loading:false
    }
     this.findOrder = this.findOrder.bind(this);
  }
  findOrder(e){
    e.preventDefault();
    // var bodyFormData = new FormData();
    // bodyFormData.set('order_id', this.state.number);
    // bodyFormData.set('email', this.state.email);
    // bodyFormData.set('store', 'https://replica-4.myshopify.com');
    this.setState({loading:true})
    var self = this;
     var url = "https://shopify1.llank.com/order";
     var settings = {
  "async": true,
  "crossDomain": true,
  "url": "https://shopify1.llank.com/order",
  "method": "POST",
  "headers": {
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache",
  },
  "data": {
    "order_id": this.state.number,
    "email": this.state.email,
    "store": $('#storeId').val(),
  }
}
$.ajax(settings).done(function (response) {
    if(response.data){
       self.setState({screen1:false,orderData:response.data,errMsg:"",loading:false});
    }else{
       self.setState({errMsg:"Please check your details and try again!"})
      }
}).fail(function(response){
  self.setState({errMsg:"Please check your details and try again!",loading:false})
});
 }

 handleChange(value, type){
   if(type == "number"){
     this.setState({number:value});
   }else{
     this.setState({email:value});
   }
 }

 componentWillReceiveProps(nextProps){
    console.log(nextProps);
 }
  render() {
    console.log(this.state.errMsg);
    return (
        <div className="blockcontainer">

              <div className="display_block">
              <div className="display_block  heading mb40">
                
                  <h2>Order Status</h2>
                
              </div>
      <p>{this.state.errMsg}</p>
      {this.state.screen1 ? <FetchOrder loading={this.state.loading} findOrder={(e) => {this.findOrder(e)}} handleChange={(value,type) => {this.handleChange(value, type)}}/> : <OrderDetails orderData={this.state.orderData} />}
      </div>
      <div className="clearfix"></div>
      </div>

    );
  }
}

export default App;


class FetchOrder extends Component {

  render() {
    return (
       <div className="blockcontainermain">
          <div className="display_block mb40">
            <div className="display_block">
              <p>Please use the form below to enter the order number and your email address.  Will fill in rest later. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris accumsan libero eget lacus aliquet semper. Mauris suscipit laoreet ex in condimentum. Vestibulum dignissim semper pulvinar. Morbi ut cursus est, eget cursus mi. Cras vulputate, sem non sollicitudin dapibus, urna eros sodales orci, et consequat enim ante quis massa.</p>
            </div>
          </div>
          <div className="display_block mb40">
            <div className="blockcontainerinner">
              <form className="horizontalform order_status_form" onSubmit={e => this.props.findOrder(e)}>
              <div className="formGroup display_block">
                <label htmlFor="inputnumber" className="width25 textleft">Order Number</label>
                <div className="width75">
                  <input type="text" onChange={e => this.props.handleChange(e.target.value,'number')} className="formInput" id="inputnumber" placeholder="Enter Order Number" />
                </div>
              </div>
              <div className="formGroup display_block">
                <label htmlFor="inputemail" className="width25 textleft">Email Address</label>
                <div className="width75">
                  <input type="email"  onChange={(e) => this.props.handleChange(e.target.value,'email')} className="formInput" id="inputemail" placeholder="Enter Email" />
                </div>
              </div>
              <div className="formGroup display_block">
                <div className="width75 display_block floatRight">
                  <input type="submit" value={this.props.loading ? "Please wait" : "Find Order"} className="customButton defaultbtn" />
                </div>
              </div>
              <div className="clearfix"></div>
        </form>
    </div>
  </div>
  <div className="clearfix"></div>
 </div>

    );
  }
}

class OrderDetails extends Component {
  render() {
    let data = this.props.orderData;
    var subtotal = 0;
    return (
      <div className="blockcontainermain order">
      <div className="display_block order-details">
        <div className="width50 mb20 order_no">
          <h4 className="fontbold">Order Number <span className="textBlue order-number">{data.order_number}</span></h4>
            <ul>
              <li>Email: <span>{data.email != undefined ? data.email : ""}</span></li>
              <li>Date: <span>{data.processed_at != undefined ? data.processed_at : ""}</span></li>
              <li>Last Update: <span>{data.updated_at != undefined ? data.updated_at : ""}</span></li>
            </ul>
        </div>
        <div className="width50 textright mb20">
          <h4>Status <span className="status_label status_label_success">Not Given</span></h4>
            <ul>
              <li>Payment: <span>{data.processing_method != undefined ? data.processing_method : ""}</span></li>
              <li>Card Endings: <span>111</span></li>
              <li>Order Notes: <span>{data.note != undefined ? data.note : "No Notes"}</span></li>
            </ul>
        </div>
        <div className="width50 mb20">
          <h4 className="fontbold">Billing Address</h4>
            <ul>
              <li>{data.billing_address && data.billing_address.first_name != undefined ? data.billing_address.first_name  : ""}</li>
              <li>{data.billing_address && data.billing_address.address != undefined ? data.billing_address.address : ""}</li>
              <li>{data.billing_address && data.billing_address.phone != undefined ? data.billing_address.phone : ""}</li>
            </ul>
        </div>
        <div className="width50 textright mb20">
          <h4 className="fontbold">Shipping Address </h4>
            <ul>
            <li>{data.shipping_address && data.shipping_address.first_name != undefined ? data.shipping_address.first_name : ""}</li>
            <li>{data.shipping_address && data.shipping_address.address1 != undefined ? data.shipping_address.address1 : ""}</li>
            <li>{data.shipping_address && data.shipping_address.phone != undefined ? data.shipping_address.phone  : ""}</li>
            </ul>
        </div>
      </div>
      <div className="display_block mb20">
        <div className="display_block">
          <div className="tableResponsive order-status">
          <table className="statustable tableStriped">
              <thead>
                <tr>
                  <th style={{width:"50%"}}>Name</th>
                  <th style={{width:"30%"}}>Price</th>
                  <th style={{width: "10%"}}>Quantity</th>
                  <th style={{width: "10%"}}>Total</th>
                </tr>
              </thead>
              <tbody>
              {data.line_items.map((item, i) => {
                var total = item.price*item.quantity;
                subtotal+=total;
                return(<tr key={i}>
                  <td>{item.title != undefined ?item.title : ""}</td>
                  <td>{item.price != undefined ?item.price  : ""}</td>
                  <td>{item.quantity != undefined ? item.quantity : ""}</td>
                  <td>${total}</td>
                </tr>)

              })}

              </tbody>
            </table>
          </div>
        </div>

    </div>
    <div className="display_block">
      <div className="width50 floatRight textright">
        <div className="tableResponsive summary">
            <table className="statustable">
              <tbody>
                <tr className="row1">
                  <th>Subtotal:</th>
                  <td className="text-right">${data.subtotal_price != undefined ? data.subtotal_price : ""}</td>
                </tr>
                <tr>
                  <th>Total Tax: </th>
                  <td className="text-right">${data.total_tax != undefined ? data.total_tax : ""}</td>
                </tr>
                <tr>
                  <th>Total:</th>
                  <td className="textRight textBlue fontbold"><p className="total">${data.total_price != undefined ? data.total_price : ""}</p></td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
    </div>


    );
  }
}