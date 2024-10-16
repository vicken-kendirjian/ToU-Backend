const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const Feedback = require('../models/Feedback');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const request = require('request-promise')
const { requireAuth, checkUser } = require('../middleware/Middleware');
const nodemailer = require('nodemailer');
require('dotenv').config();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');

aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION
})
const BUCKET = process.env.BUCKET
const s3 = new aws.S3();

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });


  const sendAssignedEmailClient = async (email, name, lastname, pname, d1, d2) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Assigned!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nHas been assigned to a traveler and will soon be on its way ToU!\nIt should arrive between '+ d1 + ' and '+d2 +'\n\nBest regards,\n'
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

module.exports.accept_order_GET = async (req, res) => {
    res.send("You are here. "+req.userId)
}

/*The accept_order function first extracts the travelerId, orderId, and token from the HTTP request.
It then uses the travelerId and orderId to retrieve the traveler and order objects from the database.
If the order has not been confirmed by the client yet, the function sends an HTTP response with a status 
    code of 400 and a message indicating that the traveler should wait for the client to confirm the order.
If the order has been confirmed by the client, the function checks whether the traveler has not previously 
    accepted the order, the order status is 2, and the traveler has a valid ticket. If these conditions are 
    met, the function assigns the order to the traveler by updating the assigned_orders, waiting_resp, and 
    ticket fields of the order, and the active_orders and pending_orders fields of the client. The function 
    then sends an email to the client informing them that their order has been assigned to a traveler. Finally, 
    the function saves the updated traveler and order objects to the database and sends an HTTP response with a 
    status code of 200 and a message indicating that the order has been successfully assigned.*/ 
module.exports.accept_order = async (req, res) => {
    const travelerId = req.userId;
    const orderId = req.params.orderid;
    const token = req.nat;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);
        if(!order.client_confirmed){
            console.log("huna")
            res.status(400).json({ message:'Please wait until the client has confirmed their order', token});
            return;
        }

        if(order.status == 2 && order.waiting_resp == true && traveler.new_orders.includes(orderId) && order.client_confirmed && traveler.ticket) {
            console.log('here')
            let index = traveler.new_orders.indexOf(orderId);
            console.log(index);
            if (index !== -1) {
                console.log("HEERE");
                traveler.new_orders.splice(index, 1);
                console.log(traveler.new_orders);
                await traveler.save();
            }
            traveler.assigned_orders.push(orderId); // add the order to the assigned_orders array
            order.waiting_resp = false;
            order.ticket = traveler.ticket;
            const clientId = order.client;
            const client = await User.findById(clientId);
            let indexc = client.pending_orders.indexOf(orderId);
            if (indexc !== -1) {
                client.pending_orders.splice(indexc, 1);
            }
            client.active_orders.push(orderId);
            await client.save();
            const prodId = order.item;
            const prod = Product.findById(prodId);

            const ticketId = traveler.ticket;
            const ticket = await Ticket.findById(ticketId);
            let date_string = ticket.departure.toUpperCase();
            let date_format = "DDMMM";
            let date = moment(date_string, date_format);
            let new_date = date.add(7, 'days');
            let new_date_string = new_date.format(date_format);

            sendAssignedEmailClient(client.email, client.name, client.lastname, prod.title, date_string, new_date_string);
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
            res.status(200).json({message: 'Successfully Accepted Order',token});
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: 'Failed to assign order', token });
    }
}

/*The `reject_order` function begins by getting the `travelerId`, `orderId`, and `token` from the request object. 
    It then tries to find the traveler and order objects in the database using the IDs provided. 
If the order meets the conditions to be rejected, the function updates the order's status, pickup location, 
    estimated arrival, waiting_resp, and traveler properties to their initial values. It then saves the updated order and traveler objects to the database.
Finally, the function sends a JSON response with a message indicating that the order was rejected and a token. 
If there is an error during this process, the function sends a JSON response indicating that the order could not be rejected and a token.*/
module.exports.reject_order = async (req, res) => {
    const travelerId = req.userId;
    const orderId = req.params.orderid;
    const token = req.nat;
    try {
        const traveler = await Traveler.findById(travelerId);
        const order = await Order.findById(orderId);

        if((order.status == 1 || order.status == 2) && order.waiting_resp == true && traveler.new_orders.includes(orderId)) {
            let index = traveler.new_orders.indexOf(orderId);
            if (index !== -1) {
                traveler.new_orders.splice(index, 1);
            }
            order.status = 0;
            order.pickup_location = "";
            order.estimated_arrival = "";
            order.waiting_resp = false;
            order.traveler = null;
            await order.save();
            await traveler.save(); // save the updated traveler object to the database
        }

        res.status(200).json({ message: 'Order rejected' , token});
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ message: 'Failed to assign order', token });
    }
}

/*The cancel_flight function first extracts the token and travelerId from the HTTP request and retrieves the corresponding traveler object from the database.
The function then loops through the traveler's new_orders and assigned_orders arrays, canceling each order by setting their respective fields to default values 
    and sending an email to each client to inform them of the cancellation.
After canceling all the orders, the function updates the traveler's order arrays, sets their active status to false, and sets their provided_pickup field to an empty 
    string before saving the updated traveler object to the database.
Finally, the function sends an HTTP response with a status code of 200 and a message indicating that the flight has been successfully canceled, along with the 
    authentication token. If an error occurs during the execution of this function, it sends an HTTP response with a status code of 400 and a message indicating that the 
    flight could not be canceled.*/ 
module.exports.cancel_flight = async (req, res) => {
    const token = req.nat;
    const travelerId = req.userId;
    const traveler = await Traveler.findById(travelerId);
    try{
        for (let i = 0; i < traveler.new_orders.length; i++) {
            const order = await Order.findById(traveler.new_orders[i]);
            order.traveler = null;
            order.pickup_location = "";
            order.waiting_resp = false;
            order.status = 0;
            order.estimated_arrival = "";
            await order.save();
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: trav.email, // recipient's email address
                subject: 'ToU: Order back to pending',
                text: 'Dear ' + (await User.findById(order.client).name) + ' ' + (await User.findById(order.client).lastname) + ',\n\n' + 'Your order has been canceled by the traveler. It is now back to pending.\nFor more information, please contact us.\n\n' + 'Best regards,\n' + 'The ToU Team'
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
        };
        for (let i = 0; i < traveler.assigned_orders.length; i++) {
            const order = await Order.findById(traveler.assigned_orders[i]);
            order.traveler = null;
            order.waiting_resp = false;
            order.status = 0;
            order.estimated_arrival = "";
            order.pickup_location = "";
            await order.save();
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: trav.email, // recipient's email address
                subject: 'ToU: Order back to pending',
                text: 'Dear ' + (await User.findById(order.client).name) + ' ' + (await User.findById(order.client).lastname) + ',\n\n' + 'Your order has been canceled by the traveler. It is now back to pending.\nFor more information, please contact us.\n\n' + 'Best regards,\n' + 'The ToU Team'
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
        };
        traveler.canceled_orders.concat(traveler.assigned_orders, traveler.new_orders);
        traveler.active = false;
        traveler.new_orders = [];
        traveler.assigned_orders = [];
        traveler.provided_pickup = "";
        await traveler.save();
        return res.status(200).json({ message: 'Flight canceled' , token});
    }
    catch{
        res.status(400).json({ message: 'Failed to cancel flight' , token});
    }
};

/*The providePickup_post function first extracts the travelerId and token from the HTTP request.
It then uses the travelerId to retrieve the traveler object from the database.
The function then updates the provided_pickup field of the traveler object with the pickup location received 
in the request body. Finally, the function saves the updated traveler object to the database and sends an HTTP 
response with a status code of 200 and a message indicating that the pickup location has been successfully provided.*/
module.exports.providePickup_post = async (req, res) => {
    const travelerId = req.userId;
    const token = req.nat;
    const traveler = await Traveler.findById(travelerId);
    traveler.provided_pickup = req.body.pickupLocation;
    await traveler.save();
    res.status(200).send({message: 'Pickup location provided',token});
};

const upload1 = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_receipt';
            cb(null, filename);
        } 
    })
})

/*The uploadReceipt function first uses the upload1 middleware to upload a single file from the HTTP request. 
    If an error occurs during the upload process, the function sends an HTTP response with a status code of 400 and a message indicating that the upload failed.
The function then extracts the orderId from the HTTP request and retrieves the corresponding order object from the database. 
    It updates the order's receipt field with the filename of the uploaded file and saves the updated order object to the database. 
    Finally, the function sends an HTTP response with a message indicating that the upload is complete.*/
module.exports.uploadReceipt_post = async (req, res) => {
    upload1.single('file')(req, res, async (err) => {
      if (err) {
        console.log(err);
        return res.status(400).send({ error: err.message, token });
      }
      const orderId = req.params.orderid;
      const order = await Order.findById(orderId);

      const filename = req.file.key; 
      
      order.receipt = filename;
      order.save().then(console.log(order));
      
      res.send('Done');
    });
};

const upload = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_proof';
            cb(null, filename);
        } 
    })
})



const upload2 = multer({
    storage: multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:'public-read',
        key:(req, file, cb) => {
            const filename = req.params.orderid + '_proof';
            cb(null, filename);
        } 
    })
})


/*The uploadProof_post function first extracts the token from the HTTP request and uses it for authentication.
It then uses the orderId to retrieve the order object from the database.
If there is an error during file upload, the function sends an HTTP response with a status code of 400 and an error message.
Otherwise, the function updates the proof field of the order with the filename of the uploaded file and saves it to the database. 
    Finally, the function sends an HTTP response with a status code of 200 and a message indicating that the upload is done. 
    If an error occurs during the execution of the function, it sends an HTTP response with a status code of 400 and an error message.*/
module.exports.uploadProof_post = async (req, res) => {
    try{
        const token = req.nat;
        upload2.single('file')(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(400).send({ error: err.message, token });
        }
        const orderId = req.params.orderid;
        const order = await Order.findById(orderId);

        const filename = req.file.key; 
        
        order.proof = filename;
        order.save().then(console.log(order));
        
        res.send({message:'Done', token});
        });
    }
    catch(err){
        res.status(400).send({error: err.message, token});
    }
  };



  const sendOnTheWayEmail = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is on its way!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nIs being shipped and will be soon delivered ToU!\n\nBest regards,\n'
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

/*The markshipped function first extracts the token and orderId from the HTTP request.
It then uses the orderId to retrieve the order object from the database.
If the order exists, the function checks whether the order status is 3 (i.e., 'ready to ship').
If the order status is 3, the function updates the order status to 4 (i.e., 'shipped') and saves the changes to the database. 
    The function then retrieves the client and product objects related to the order and sends an email to the client using the sendOnTheWayEmail 
    function, informing them that their order is on the way. Finally, the function sends an HTTP response with a status code of 200 and a message 
    indicating that the order has been successfully marked as shipped. If the order does not exist, the function sends an HTTP response with a status 
    code of 404 and a message indicating that the order was not found. If an error occurs during the execution of the function, it sends an HTTP response 
    with a status code of 500 and a message indicating that a server error occurred.*/
module.exports.markshipped = async(req, res) => {
    const token = req.nat;
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
           if(order.status == 3){
            order.status = 4;
            order.save();

            const clientId = order.client;
            const client = await User.findById(clientId);
            const prodId = order.item;
            const prod = await Product.findById(prodId);

            sendOnTheWayEmail(client.email, client.name, client.lastname, prod.title)
           } 
           return res.status(200).json({message: 'Order marked as shipped', token});
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured', token});
        }
    }else{
        res.status(404).json({message: 'Order not Found.', token})
    }
}

const sendArrivedEmail = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Your Order is in Lebanon!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that your order:\n'+ pname+'\nLanded in Lebanon and will soon be on its way ToU!\n\nBest regards,\n'
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


/*The markarrived function first extracts the orderId and token from the HTTP request.
It then uses the orderId to retrieve the order object from the database.
If the order exists, the function checks whether the order status is 4 (shipped). If it is, the function updates the order status to 5 (arrived) 
    and saves it to the database. It then retrieves the client and product objects related to the order and sends an email to the client informing 
    them that their order has arrived.
Finally, the function sends an HTTP response with a status code of 200 and a message indicating that the order has been successfully marked as arrived. 
    If an error occurs during the execution of the function, it sends an HTTP response with a status code of 500 and a message indicating that a server 
    error occurred. If the order is not found, it sends an HTTP response with a status code of 404 and a message indicating that the order was not found.*/
module.exports.markarrived = async(req, res) => {
    const token = req.nat;
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    if(order){
        try{
           if(order.status == 4){
            order.status = 5;
            order.save();

            const clientId = order.client;
            const client = await User.findById(clientId);
            const prodId = order.item;
            const prod = await Product.findById(prodId);

            sendArrivedEmail(client.email, client.name, client.lastname, prod.title);
           }
              return res.status(200).json({message: 'Order marked as arrived', token}); 
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured', token});
        }
    }else{
        res.status(404).json({message: 'Order not Found.', token})
    }
}

/*The getPendingTrav_get function first extracts the travelerId and token from the HTTP request.
It then retrieves the traveler object from the database using the travelerId.
If the traveler object is found, the function retrieves the list of pending orders for the traveler by iterating through the traveler's new_orders array 
    and retrieving the corresponding order and product objects from the database. The function then creates an array of objects, each containing an order 
    and its corresponding product, and sends the array as a JSON object in the HTTP response along with the authentication token.
If the traveler object is not found in the database, the function sends an HTTP response with a status code of 404 and a message indicating that the traveler 
    was not found along with the authentication token.*/
module.exports.getPendingTrav_get = async (req, res) => {
    const travId = req.userId;
    const trav = await Traveler.findById(travId);
    const token = req.nat;
    if(trav){
        try{
            const list = trav.new_orders;
            const list1 = []
            for(let i = 0; i < list.length; i++){
                const order = await Order.findById(list[i])
                const product = await Product.findById(order.item)
                const obj = {order, product}
                list1.push(obj)
            }
            res.status(200).send([{porders: list1, token}]);
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Traveler Not Found', token})
    }
}

/*The getActiveTrav_get function first extracts the traveler's ID and token from the HTTP request.
It then uses the traveler's ID to retrieve the traveler object from the database.
If the traveler object exists, the function retrieves the list of assigned orders for the traveler and 
iterates over them to retrieve the product information for each order. The function creates an object containing 
the order and product information and pushes it to a new array.
Finally, the function sends an HTTP response with a status code of 200 and a JSON object containing the list of assigned 
orders and the authentication token. If the traveler object does not exist, the function sends an HTTP response with a status 
code of 404 and a message indicating that the client was not found. If an error occurs during the execution of the function, it logs the error to the console.*/
module.exports.getActiveTrav_get = async (req, res) => {
    const travId = req.userId;
    const trav = await Traveler.findById(travId);
    const token = req.nat;
    if(trav){
        try{
            const list = trav.assigned_orders;
            const list1 = []
            for(let i = 0; i < list.length; i++){
                const order = await Order.findById(list[i])
                const product = await Product.findById(order.item)
                const obj = {order, product}
                list1.push(obj)
            }
            res.status(200).json( [{aorders: list1,token}]);
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client Not Found'})
    }
}

/*The splashScreen_get function first extracts the token and user type from the HTTP request.
It then checks the user type to determine which splash screen to display. If the user is a User, 
the function returns a JSON object with a status code of 691 and the user's authentication token. 
If the user is a Traveler, the function returns a JSON object with a status code of 690 and the traveler's authentication token. 
If the user is neither a User nor a Traveler, the function returns a JSON object with a status code of 692 and an empty token.
If an error occurs during the execution of this function, the catch block logs the error and sends an HTTP response with a status 
code of 400 and a message indicating that a server error has occurred.*/
module.exports.splashScreen_get = async(req, res) => {
    try{
        const token = req.nat;
        const type = req.userType;
        if(type == 'User'){
            return res.status(200).send({status: 691, token});
        }
        else if(type == 'Traveler'){
            return res.status(200).send({status: 690, token});
        }
        else{
            return res.status(200).send({status: 692, token:''});
        }
    }
    catch(err){
        console.log(err);
        res.status(400).send({message: 'Server Error Occured', token});
    }
}

/*The getProfile function first extracts the traveler's ID and token from the HTTP request.
It then uses the traveler's ID to retrieve the traveler object from the database.
If the traveler object exists, the function sends an HTTP response with a status code of 200 and the retrieved traveler object and the authentication token.
If the traveler object does not exist, the function sends an HTTP response with a status code of 400 and a message indicating that something went wrong.*/
module.exports.getProfile = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    const trav = await Traveler.findById(travId);
    if(trav){
        console.log(trav)
        res.status(200).send({trav, token});
    }
    else{
    res.status(400).json( {message: 'Something went wrong', token} )
    }
}

/*The `editProfile` function first extracts the `travId` and `token` from the HTTP request. It then uses the `travId` to retrieve the traveler object from the database.
If the traveler exists in the database, the function attempts to update the traveler's profile with the data in the HTTP request body using the `findByIdAndUpdate` method. 
If the update is successful, the function sends a response with the updated traveler object and the authentication token.
If an error occurs during the update process, the function sends a response with a status code of 500 and the error message.
If the traveler does not exist in the database, the function sends a response with a status code of 500 and an error message.*/
module.exports.editProfile = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    const trav = await Traveler.findById(travId);
    if(trav){
        try {
            const trav = await Traveler.findByIdAndUpdate(travId, req.body, { new: true });
            res.send({trav, token});
          } catch (error) {
            res.status(500).send(error);
          }
    }else{
        res.status(500).send(error, token);
    }
}

/*The hasTicket function first extracts the travelerId and token from the HTTP request.
It then uses the travelerId to retrieve the traveler object from the database.
If the traveler object exists and the active field is true, the function retrieves the ticket object from the database and sends an HTTP response 
with a status code of 200 and a JSON object containing the hasTicket property set to true and the ticket object. If the active field is false, 
the function sends an HTTP response with a status code of 200 and a JSON object containing the hasTicket property set to false.
If the traveler object cannot be retrieved from the database, the function sends an HTTP response with a status code of 400 and a message indicating that something went wrong. 
If an error occurs during the execution of this function, it will throw an error with a status code of 500 and a message indicating that a server error occurred.*/
module.exports.hasTicket = async (req, res) => {
    const travId = req.userId;
    const token = req.nat;
    try{
        const trav = await Traveler.findById(travId);
        if(trav){
            if(trav.active){
                const ticket = await Ticket.findById(trav.ticket);
                return res.status(200).send({hasTicket:true,ticket, token});
            }
            else{
                return res.status(200).send({hasTicket:false, token});
            }
        }
        else{
            res.status(400).json( {message: 'Something went wrong', token} )
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send({message: 'Server Error Occured', token});
    }
}