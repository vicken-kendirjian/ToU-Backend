const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const { requireAuth, checkUser } = require('../middleware/Middleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const Feedback = require('../models/Feedback');
const rs = require('randomstring');
const bcrypt = require('bcrypt');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });
let transporter1 = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'donotreply.tou.lebanon@outlook.com', // your email address
    pass: '*31&pCbE' // your email password
  }
});





  const sendProofEmailApproved = async (email, name, lastname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Valid Proof',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your submitted proof has been approved.\n\n' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}



const send2to3EmailClient = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order rejected',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been acquired by the traveler!. \n' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter1.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}

const sendAssignmentEmail = async (email, name, lastname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: New Order',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that you have been assigned a new order.\n\nPlease make sure to accept or reject the order as soon as possible' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}


const sendProofEmailRejected = async (email, name, lastname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Valid Proof',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your submitted proof has been rejected. \nPlease upload another one as soon as posssible.\n' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}


const sendOrderRejectionEmail = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order rejected',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been rejected. \nDo not hesitate to contact us for any inconvenience.\n' + 'Best regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}


const sendOrderAcceptEmail = async (email, name, lastname, pname, orderid, order_cost) => {
    const secret = process.env.SECRET_CONFIRM_ORDER
    const payload= {
        email: email,
        pname: pname
    }
    const token = jwt.sign(payload, secret, {expiresIn: '31d'});
    const link = 'http://localhost:5000/confirmorder/'+token+'/'+orderid;
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Accepted',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your requested order:\n'+ pname +'\nhas been accepted.\n The delivery will cost you '+ order_cost +' \nClick on the link to confirm this order.\n'+link + '\n\nBest regards,\n'
        };
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    console.log(link);
                    resolve();
                }
            });
        });
}








const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION
})

const BUCKET = process.env.BUCKET
const s3 = new aws.S3();



module.exports.getTravelers_get = async (req, res) => {
    // const token = req.nat
    console.log('hi');
    const travelers = await Traveler.find({approved: true});
    res.status(200).json({travelers});
}

module.exports.getAllClients = async (req, res) => {
    console.log('fetching list of all clients...')
    const clients = await User.find();
    res.status(200).json({clients})
}

module.exports.download_proof_get = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const filename = order.proof;
            if(!filename){
                res.send({message: 'A proof has not been sent by the Traveler'})
                return;
            }
            console.log(filename);
            const x = await s3.getObject({Bucket: BUCKET, Key: filename}).promise();
    
            res.send(x.Body);
    
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json({ message: 'Order not found.'})
    }
}


module.exports.rejectProof_post = async( req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const name = traveler.name;
            const lastname = traveler.lastname;
            const email = traveler.email;
            sendProofEmailRejected(email, name, lastname);
            res.status(200).send('Successfully Rejected the Proof Upload')
        }catch(err){
            console.log(err);
            res.status(500).json( {message: 'Sever Error Occured'})
        }
    }else{
        res.status(404).json({message: 'Order not found'})
    }
}

module.exports.update_delivery_status_post = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(order){
        try{
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const name = traveler.name;
            const lastname = traveler.lastname;
            const email = traveler.email;
            if(order.status==2){
                order.status = 3;
                order.save().then(sendProofEmailApproved(email, name, lastname));

                const prodId = order.item;
                const prod = await Product.findById(prodId);
                const clientId = order.client;
                const client = await User.findById(clientId);
                send2to3EmailClient(client.email, client.name, client.lastname, prod.title)
                res.send({order, incremented: true});
            }
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json({ message: 'Order not found.'})
    }
}


module.exports.get_pendingOrders_get= async (req, res) => {
    const pendingOrders = await Order.find({status: 0});
    res.status(200).json({pendingOrders});
}
module.exports.get_activeOrders_get = async (req, res) => {
    const activeOrders = await Order.find({status: {$gt: 1, $lt: 7}});
    res.status(200).json({activeOrders});
  }
  



module.exports.get_anorder_get = async (req, res) => {
    const anOrdrerId = req.params.orderid;
    const anOrder = Order.findById(anOrdrerId);
    res.send(anOrder);
}


module.exports.get_waitingpending_get = async (req, res) => {
    const orders = await Order.find({status: 0, waiting_resp: true});
    res.send(orders);
}




module.exports.getActiveTravelers_get = async (req, res) => {
    try{
        const activeTravelers = await Traveler.find({active: true, revoked: false, ticket: {$ne: null, $ne: undefined}});

        if(activeTravelers.length>0){
            res.status(200).json(activeTravelers);
        }else{
            res.status(404).json({message: 'No active travelers were found.'})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Server Error Occured'})
    }
    
}

module.exports.assign_order_post = async (req, res) =>{
    const orderId = req.params.orderid;
    const travelerId = req.params.travelerid;
    const order = await Order.findById(orderId);
    const traveler = await Traveler.findById(travelerId);
    if(!traveler.active){
        res.status(400).json({message: 'Traveler has yet to provide Ticket'})
    }
    if(order && traveler && traveler.active==true && !traveler.revoked){
        try{
            if(order.cost==null){
                res.status(400).send('Please assign a cost to this order before assigning it');
                return;
            }
            order.traveler = travelerId;
            order.waiting_resp = true;
            traveler.new_orders.push(orderId);
            order.status = 1;
            order.pickup_location = traveler.provided_pickup;
            await order.save();
            await traveler.save();
            
            const productId = order.item;
            const product = await Product.findById(productId);
            const pname = product.title;
            const clientId = order.client;
            const client = await User.findById(clientId);
            if (!order.client_confirmed) sendOrderAcceptEmail(client.email, client.name, client.lastname, pname, orderId, order.cost);
            sendAssignmentEmail(traveler.email, traveler.name, traveler.lastname);
            res.status(200).json('Successfully Assigned Order & sent email to client and traveler');
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json({ message: 'Order or Traveler not found.'})
    }


}


module.exports.rejectorder_post = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
            console.log(order.status)
            if(order.status == 0 && order.waiting_resp == false && order.traveler == null){
                order.status = -1;
                order.save().then(console.log(order));
                const productId = order.item;
                const product = await Product.findById(productId);
                const pname = product.title;
                const clientId = order.client;
                const client = await User.findById(clientId);
                const index = client.pending_orders.indexOf(orderId);
                client.pending_orders.splice(index, 1);
                sendOrderRejectionEmail(client.email, client.name, client.lastname, pname)
                await client.save();
                res.status(200).json( {message: 'Order has been successfully rejecetd'})
            }else{
                res.status(418).json( {message: 'Cannot reject order as it has already been processed.'})
            }
        }catch(err){
            console.log(err)
        }
    }else{
        res.status(400).json( {message: 'Order not found'})
    }
}



module.exports.revoke_order_post = async (req, res) => {
    const orderId = req.params.orderid;
    const order = Order.findById(orderId);
    if(order){
        try{
            const traveler = Traveler.findById(order.traveler);
            if(traveler.new_orders.includes(orderId) && order.waiting_resp == true){
                order.traveler = null;
                order.waiting_resp = false,
                order.save();
                let index = traveler.new_orders.indexOf(orderId);
                if (index !== -1) {
                    traveler.new_orders = traveler.new_orders.splice(index, 1);
                    traveler.save();
                }
                console.log(order);
                console.log(traveler);
                res.status(200).json( {message: 'Order has been successfully revoked'})
            }
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(400).json( {message: 'Order not found'})
    }
}



module.exports.setcost_post = async (req, res) => {
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
            const productId = order.item;
            const product = await Product.findById(productId);
            const price =  parseInt(product.price.replace("$", ""));
            const cost = parseInt(req.body.cost);
            console.log(price, cost)
            const t_commission = parseInt((cost - price)/3)*2;
            const a_commission = parseInt(t_commission)/2;
            console.log(t_commission);
            order.cost = cost;
            order.a_commission = parseInt(a_commission);
            order.t_commission = parseInt(t_commission);
            order.save();
            console.log(order);
            res.status(200).json( {message: 'Order cost has been successfully updated.'})
        }catch(err){

        }
    }else{
         res.status(400).json( {message: 'Order not found'})
    }
}



module.exports.revoke_access_post = async (req, res) => {
    const travelerId = req.params.travelerId;
    const traveler = Traveler.findById(travelerId);
    if(traveler){
        try{
            traveler.active = false;
            traveler.revoked = true;
            await traveler.save();
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(400).json({ message: 'Traveler does not exist'})
    }
}




module.exports.deleteTraveler = async (req, res) => {
  const travelerId = req.params.travelerid;

  try {
    const traveler = await Traveler.findById(travelerId);
    
    if (traveler) {
      await traveler.remove();
      res.status(200).json({ message: 'Traveler has been successfully deleted.' });
    } else {
      res.status(404).json({ message: 'Traveler not found.' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'An error occurred while deleting the traveler.' });
  }
}


module.exports.getrevoked_list = async(req, res) => {
    try{
        const list = await Traveler.find( {revoked: true});
        if(list.length>0){
            res.status(200).json(list);
        }
        res.status(400).json({ message: 'The are no revoked travelers'});
    }catch(err){
        console.log(err);
    }
}

module.exports.getrevokedTraveler_get = async(req, res) => {
    const travelerId = req.params.travelerid;
    const traveler = await Traveler.findById(travelerId);
    try{
        if(traveler){
            res.status(200).json(traveler);
        }else{
            res.status(404).json( {message: 'Traveler not found.'})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error occured'});
    }
}



module.exports.unrevoke_post = async(req, res) => {
    const travelerId = req.params.travelerid;
    const traveler = await Traveler.findById(travelerId);
    try{
        if(traveler){
            traveler.revoked = false;
            traveler.active = true;
            traveler.save();
            res.status(200).json({traveler, message: 'Successfully Unrevoked Access'});
        }else{
            res.status(404).json( {message: 'Traveler not found.'})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error occured'});
    }
}

module.exports.setTestimonial_post = async(req, res) => {
    try{
        const orderid = req.params.orderid;
        const order = await Order.findById(orderid);
        const feedback = order.feedback;
        if(feedback){
            feedback.testimonial = true;
            await feedback.save();
            res.status(200).json({message: 'Testimonial has been successfully set.'});
        }else{
            res.status(404).json({message: 'Feedback not found.'});
        }
    }catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error occured'});
    }
}

module.exports.markSentOut = async(req, res) => {
    try{
        const orderid = req.params.orderid;
        const order = await Order.findById(orderid);
        if(order){
            if(order.status == 5){
                order.status = 6;
                await order.save();
            }
            else{
                return res.status(400).json({message: 'Order is not at arrived stage '});
            }
            return res.status(200).json({message: 'Order has been successfully marked as sent.'});
        }else{
            res.status(404).json({message: 'Order not found.'});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error occured'});
    }
}

module.exports.acceptTraveler_post = async (req, res) => {
    const tid = req.params.id;
    const trav = await Traveler.findById(tid);
    if(!trav) res.send("not registered");
    else{
      trav.approved=true;
      trav.reviewed=true;
      const password = rs.generate(10) + 'Aa1!';
      const salt = await bcrypt.genSalt();
      trav.password = await bcrypt.hash(password, salt);
      await trav.save();
      let mailOptions = {
          from: 'donotreply.tou.lebanon@outlook.com', // your email address
          to: trav.email, // recipient's email address
          subject: 'ToU Traveler Acceptance',
          text: 'Dear ' + trav.name + ' ' + trav.lastname + ',\n\n' + 'Congratulations! Your application to be a traveler with ToU has been approved. You can now log in to your account and start accepting orders using the below credentials:\nemail: '+ trav.email + '\npassword: ' + password + '\n\n' + 'Best regards,\n' + 'ToU Team'
          };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        res.status(200).json({message: 'Traveler has been successfully accepted.'});
    }
}

module.exports.rejectTraveler_post = async (req, res) => {
    const tid = req.params.id;
    const trav = await Traveler.findById(tid);
    if(!trav) res.send("not registered");
    else{
      trav.reviewed=true;
      await trav.save();
      let mailOptions = {
          from: 'donotreply.tou.lebanon@outlook.com', // your email address
          to: trav.email, // recipient's email address
          subject: 'ToU Traveler Rejection',
          text: 'Dear ' + trav.name + ' ' + trav.lastname + ',\n\n' + 'Unfortunately, your application to be a traveler with ToU has been rejected.\n\n' + 'Best regards,\n' + 'ToU Team'
          };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        res.status(200).json({message: 'Traveler has been successfully rejected.'});
    }
}