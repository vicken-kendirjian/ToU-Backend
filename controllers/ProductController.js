const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const request = require('request-promise')
const { requireAuth, checkUser } = require('../middleware/Middleware');
const nodemailer = require('nodemailer');
const { copy } = require('../routes/AdminRoute');


let transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'donotreply.tou.lebanon@outlook.com', // your email address
    pass: '*31&pCbE' // your email password
  }
});


const sendDecisionEmail = (email, name, lastname, title, result) => {
  let mailOptions = {
      from: 'donotreply.tou.lebanon@outlook.com', // your email address
      to: email, // recipient's email address
      subject: 'ToU: Email Confirmation',
      text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to inform you that your order:\n'+ title + '\nhas been ' + result + '.'
      };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
        console.log(link);
      }
    });
}

function getProdId(s) {
    for (var i = 0; i < s.length; i++) {
      let startIndex;
      let endIndex;
      if (
        s.charAt(i) == "/" &&
        s.charAt(i + 1) == "d" &&
        s.charAt(i + 2) == "p"
      ) {
        startIndex = i + 4;
        endIndex = startIndex + 10;
        return s.substring(startIndex, endIndex);
      }
    }
  }




  function extractProductInfo(str) {
    let weight = -1;
    let length = -1;
    let width = -1;
    let height = -1;

    // Extract weight
    const weightRegex = /(\d+(\.\d+)?)\s*(pounds|lb|lbs|ounces|oz)/i;
    const weightMatch = str.match(weightRegex);
    if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
        if (weightMatch[3].toLowerCase() === 'ounces' || weightMatch[3].toLowerCase() === 'oz') {
            weight /= 16;
        }
    }

    // Extract dimensions
    const dimensionsRegex = /(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)\s*(inches|in)/i;
    const dimensionsMatch = str.match(dimensionsRegex);
    if (dimensionsMatch) {
        length = parseFloat(dimensionsMatch[1]);
        width = parseFloat(dimensionsMatch[3]);
        height = parseFloat(dimensionsMatch[5]);
    }

    return "Weight: " + weight + " Length: " + length + " Width: " + width + " Height: " + height;
}
  
  
  


async function getData(youRL){
    const response = await request({
      uri: youRL,
      headers: {
        authority: "www.amazon.com",
        method: "GET",
        // 'path' : '/Nike-Barcelona-Soccer-2021-2022-X-Large/dp/B08T6LRBVR/ref=sr_1_9?crid=5CNPO2HL3UD1&keywords=fcb%2Bjersey&qid=1676139460&sprefix=fcb%2Bjers%2Caps%2C352&sr=8-9&th=1',
        scheme: "https",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "device-memory": "8",
        downlink: "4.3",
        dpr: "1",
        ect: "4g",
        // 'referer': "https://www.amazon.com/s?k=fcb+jersey&crid=5CNPO2HL3UD1&sprefix=fcb+jers%2Caps%2C352&ref=nb_sb_noss_2",
        rtt: "200",
        "sec-ch-device-memory": "8",
        "sec-ch-dpr": "1",
        "sec-ch-ua":
          '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows",
        "sec-ch-ua-platform-version": "10.0.0",
        "sec-ch-viewport-width": "683",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "viewport-width": "683",
      },
      gzip: true,
    });
    
  
    let $ = cheerio.load(response);
  
    //Getting Title
    const title = $("span[id='productTitle']").text().trim();
  
    // Getting the price
    let prices = [];
    let price;
    $(
      "div[id^='corePrice_desktop'] span[class='a-offscreen'],div[id^='corePrice_feature'] span[class='a-offscreen']"
    ).each((i, elm) => {
      let p = $(elm).text();
      if (p.includes("$")) {
        price = p;
        return false;
      }
    });
    if(price==undefined){
      price = $(
        "span[id='price_inside_buybox']"
      ).text();
    }
    
    //Getting the Image source
    let imageSource = $("#landingImage").attr("src");
    if(imageSource==undefined){
      script =  $('script[data-a-state=\'{"key":"desktop-landing-image-data"}\']');
      var data = JSON.parse(script.html());
      if(data!=null) imageSource = data.landingImageUrl;
    }
  
    //Getting ID
    const asin = getProdId(youRL);
  
    //Getting the dimensions;
    let dimensions;
    $(
      "div[id^='detailBullets_feature'] span[class='a-list-item']"
    ).each((i, elm) => {
      let dd = $(elm).text();
      if(dd.includes("Package Dimensions") || dd.includes("Product Dimensions")){
        dimensions = dd.trim();
        return false;
      };
    });
    if(dimensions==undefined){
      $(
        "table[id^='productDetails'] td[class='a-size-base prodDetAttrValue']"
      ).each((i, elm) => {
        let ddd = $(elm).text();
        if(ddd.includes("Package Dimensions") || ddd.includes("Product Dimensions") ||ddd.includes(" x ")){
          dimensions = ddd.trim();
          return false;
        };
      });
    }
    if(dimensions==undefined){
      $(
        "div[class='a-section a-spacing-small a-spacing-top-small'] span[class='a-size-base']"
      ).each((i, elm) => {
        let dddd = $(elm).text();
        if(dddd.includes("Package Dimensions") || dddd.includes("Product Dimensions") ||dddd.includes(" x ")){
          dimensions = dddd.trim();
          return false;
        };
      });
    }
    //Determine stock
    var Instock = true;
    if(price==undefined) Instock = false;
  
    

    if(dimensions){
      const dim = extractProductInfo(dimensions);
      const weight = dim.substring(dim.indexOf("Weight: ") + 8, dim.indexOf(" Length"));
      const length = dim.substring(dim.indexOf("Length: ") + 8, dim.indexOf(" Width"));
      const width = dim.substring(dim.indexOf("Width: ") + 7, dim.indexOf(" Height"));
      const height = dim.substring(dim.indexOf("Height: ") + 8);
      return {
        title,
        imageSource,
        price,
        dimensions,
        weight,
        length,
        width,
        height,
        asin,
        Instock
      }
    }else{
      return {
        title,
        imageSource,
        price,
        dimensions,
        asin,
        Instock
      }
    }


  
      
  
    
}



module.exports.productsearch_get = (req, res) => {
    res.send('u are here')
}

/*The productsearch_post function first extracts the product link from the HTTP request.
It then calls the getData function to retrieve the necessary details about the product from the link. If the dimensions or weight are unavailable, they are set to -1.
The function then formats the details into a JSON object and sends it in the HTTP response.*/
module.exports.productsearch_post = (req, res) => {
    const productLink = req.body.link;
    if(!productLink){
      return res.status(400).json({message: 'Invalid or Empty Link'})
    }
    getData(productLink).then((data) => {
      if(data.length == -1 || data.height == -1 || data.width == -1){
        const details = {
          title : data.title,
          price : data.price,
          asin : data.asin,
          imageSource : data.imageSource,
          dimensions : data.dimensions,
          weight: data.weight,
          length: data.length,
          width: data.width,
          height: data.height,
          inStock : data.Instock,
          url: productLink
      }
        return res.json(details);
      }
      else if (data.weight == -1){
        const details = {
          title : data.title,
          price : data.price,
          asin : data.asin,
          imageSource : data.imageSource,
          dimensions : data.length+" x "+data.width+" x "+data.height+" in",
          weight: data.weight,
          length: data.length,
          width: data.width,
          height: data.height,
          inStock : data.Instock,
          url: productLink
      }
        return res.json(details);
      }
      else{
        const details = {
            title : data.title,
            price : data.price,
            asin : data.asin,
            imageSource : data.imageSource,
            dimensions : data.length+" x "+data.width+" x "+data.height+" in  |  "+data.weight+" lbs",
            weight: data.weight,
            length: data.length,
            width: data.width,
            height: data.height,
            inStock : data.Instock,
            url: productLink
        }
        return res.json(details);
      }
    })
}

/*The productrequest_post function first extracts the newNAT, data, and quantity from the HTTP request.
It then uses the data to retrieve the product object from the database with the matching asin.
If the product exists in the database, the function checks if there is already a cost associated with the product. 
If so, it creates a new order with the updated cost for the requested quantity. If not, it creates a new order without a cost for the requested quantity.
If the product does not exist in the database and has no price, the function throws an error with a status code of 406 and a message indicating that the 
product is out of stock.
If the product does not exist in the database and has a price, the function creates a new product with the requested details and creates a new order for the 
client with the requested quantity. The function then returns a JSON object with a status code of 200 and a message indicating that the order has been successfully 
created, along with the new authentication token.*/
module.exports.productrequest_post = async (req, res) => {
  
  const newNAT = req.nat;
  const data = req.body.data;
  const quantity = req.params.quantity;
  const product = await Product.findOne({asin: data.asin});
  console.log("TOKEN THAT REACHED THE API: "+newNAT);
  console.log("USER IS: "+req.userId);
  try{
    if (product){//if the product already exists, enter this block
      const productId = product._id;
      const copyorder = await Order.findOne({item: productId});
      if(copyorder.cost){//checking if already existing product has a cost set to it.
        const order = new Order({
          client: req.userId,
          item: product._id,
          quantity: quantity,
          cost: ((copyorder.cost) / copyorder.quantity) * parseInt(quantity),
          a_commission : ((copyorder.a_commission) / copyorder.quantity) * parseInt(quantity),
          t_commission: ((copyorder.t_commission) / copyorder.quantity) * parseInt(quantity),
         })//Order will be created and cost will be set according to quantity.
          await order.save();
          const client = await User.findById(req.userId);
          client.pending_orders.push(order._id);
          await client.save();
          product.quantity_ordered = product.quantity_ordered + parseInt(quantity);
          await product.save();
          return res.status(200).json({message: 'Successfully Created Order with already existing product and its cost.', accessToken: newNAT});
          
      }else{//If product copy does not have an existing cost this block will be triggered
        const order = new Order({
          client: req.userId,
          item: product._id,
          quantity: quantity
         })//Order will be created without copying non-existing cost
          await order.save();
          const client = await User.findById(req.userId);
          client.pending_orders.push(order._id);
          await client.save();
          product.quantity_ordered = product.quantity_ordered + parseInt(quantity);
          await product.save();
          return res.status(200).json({message: 'Successfully Created Order with already existing product.', accessToken: newNAT});
          
      }
    }
    else{//Product does not exist in the database
      if(data.price == undefined || data.price == null || data.price == ""){//If Product has no price
        return res.status(406).json( {message: 'Product is Out of stock', token: newNAT});      //Then it means that product is out of stock
        
      }
      console.log("The product is new to the db...")
      const newProduct = new Product({
        title: data.title,
        asin: data.asin,
        price: data.price,
        dimensions: data.dimensions,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        inStock: data.inStock,
        url: data.url,
        image: data.imageSource,
        quantity_ordered : quantity
      })//Creating the new Product and saving it in the database
      await newProduct.save();
      console.log(newProduct.title);
      if(newProduct.weight && newProduct.height && newProduct.width && newProduct.length && 
        newProduct.weight!==-1 && newProduct.height!==-1 && newProduct.width!==-1 && newProduct.length!==-1){
        const Price = parseInt((newProduct.price).replace(/[^\d.]/g, ''));
        const t_commission = ( ((newProduct.length + newProduct.height + newProduct.width) * 2) + (newProduct.weight*2));
        const a_commission = t_commission / 2;
        const cost = Price + a_commission + t_commission;
        const order = new Order({
          client: req.userId,
          item: newProduct._id,
          quantity: quantity,
          cost: cost*quantity,
          t_commission: t_commission*quantity,
          a_commission: a_commission*quantity
        })
        await order.save();
        const client = await User.findById(req.userId);
        client.pending_orders.push(order._id);
        await client.save();
        return res.status(200).json({message: 'Successfully Created Order with new Product WITH cost.', accessToken: newNAT});
        
      }
      else{
        console.log("This was triggered! because no dimensions")
        const order = new Order({
          client: req.userId,
          item: newProduct._id,
          quantity: quantity
          
        })
        
        await order.save();
        const client = await User.findById(req.userId);
        client.pending_orders.push(order._id);
        await client.save();
        return res.status(200).send({message: "Successfully created Order.", accessToken: newNAT})
        
      }
      
    }
  }catch(err){
    console.log(err);
    return res.status(500).json({message: 'Server Error', token: newNAT})
    
  }
}

//const a = product.quantity_ordered;
//const b = quantity + a;
//product.quantity_ordered = b;

