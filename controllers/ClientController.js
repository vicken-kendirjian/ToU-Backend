const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cheerio = require('cheerio');
const request = require('request');
const Feedback = require('../models/Feedback');
const ContactForm = require('../models/Contact');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
});

const sendCompletiontoTraveler = async (email, name, lastname, pname) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Order Completed!',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'This email has been sent to let you know that you successfully delivered:\n'+ pname +'\nhas been acquired by the client!. \n' + 'Best regards,\n'
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

/*The function receives the JWT token and order ID from the request parameters.
The function retrieves the SECRET_CONFIRM_ORDER environment variable, which is used to verify the token.
The function verifies the token using the jwt.verify() method, which decodes the token and returns its payload. 
If the token is invalid, the function returns an error message.
If the token is valid, the function tries to find the order in the database using the Order.findById() method.
If the order is found and its status is 1 (meaning it has been accepted by an admin) and its traveler field is not null, 
the function updates the client_confirmed field to true, sets the status to 2, and saves the order to the database. 
The function then sends a response to the client with a message indicating that the order has been confirmed.
If the order has not been approved by an admin, the function sends a response to the client with a message indicating that the order has not yet been approved.
If there is an error finding or updating the order, the function logs the error to the console.
If the confirmation date has expired, the function sends a response to the client with a message indicating that the confirmation date has expired.*/
module.exports.confirm_order_get = async (req, res) => {
    const token = req.params.token;
    const orderId = req.params.orderid;
    const secret = process.env.SECRET_CONFIRM_ORDER;
    const payload = jwt.verify(token, secret);
    if(payload){
        try{
            const order = await Order.findById(orderId);
            console.log(order)
            if(order.status == 1 && order.traveler!=null){
                order.client_confirmed = true;
                order.status = 2;
                order.save().then(console.log(order));
                res.status(200).json( {message: 'Successfully Confirmed Order'});
            }else{
                res.status(400).json({ message: 'Order has not yet been approved by an admin'});
                
            }
        }catch(err){
            console.log(err);
        }
    }
    else res.status(404).json( {message: 'Confirmation Date Expired'});
}

/*The function receives the authenticated client ID and NAT token from the request parameters.
The function finds the client in the database using the User.findById() method.
If the client is found, the function retrieves the list of pending orders from the client's pending_orders field.
The function initializes an empty array list1 to hold the order and product objects.
The function uses a for loop to iterate over each order ID in the list of pending orders.
For each order ID, the function retrieves the order object from the database using the Order.findById() method.
The function retrieves the product object associated with the order using the Product.findById() method.
The function creates a new object obj containing both the order and product objects.
The function adds the new object obj to the list1 array.
After all order and product objects have been retrieved, the function sends a JSON response to the client containing the list1 array and the NAT 
token used to authenticate the request.
If the client is not found, the function sends a JSON response to the client with a message indicating that the client was not found.
If there is an error finding the client, orders, or products, the function logs the error to the console.*/
module.exports.getPendingClient_get = async (req, res) => {
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const token = req.nat;
    if(client){
        try{
            const list = client.pending_orders;
            const list1 = []
            for(let i = 0; i < list.length; i++){
                const order = await Order.findById(list[i])
                console.log(order)
                const product = await Product.findById(order.item)
                const obj = {order, product}
                list1.push(obj)
            }
            res.status(200).send([{porders: list1, token}]);
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client Not Found', token})
    }
}

/*The function starts by extracting the userId and nat parameters from the request.
It then tries to find the client in the database using the clientId parameter.
If the client is found, the function gets the list of active orders for the client and reads the order and product data.
It then constructs an array of objects, with each object containing an order and its associated product.
Finally, the function sends a JSON response containing the array of orders and a token. If the client is not found, the function sends an error message and a token.*/
module.exports.getActiveClient_get = async (req, res) => {
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const token = req.nat;
    if(client){
        try{
            const list = client.active_orders;
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
        res.status(404).json( { message: 'Client Not Found', token})
    }
}

//
module.exports.getActiveOrder_get = async (req, res) => {
    const clientId = req.user._id;
    const client = await User.findById(clientId);
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);

    if(client && order && client.active_orders.includes(orderId)){
        try{
            const status = order.status;
            res.status(200).json( {status});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client or Order Not Found'})
    }
}


/*The complete_order_post function first extracts the token, clientId, and orderId from the HTTP request.
It then uses the clientId and orderId to retrieve the client and order objects from the database.
If the client and order exist in the database and the order status is 6, the function updates the order status to 7 and updates the client and 
traveler objects in the database by adding the completed order to their respective completed_orders array and removing it from their active_orders array.
If the traveler has no new orders or assigned orders, the function sets the traveler's active status to false and removes the pickup location.
The function then sends an email to the traveler informing them that their order has been completed and returns a JSON object with a status code of 200 and a 
message indicating that the order has been successfully completed.
If the client or order cannot be found, the function returns a JSON object with a status code of 404 and a message indicating that the client or order could not be found.*/
module.exports.complete_order_post = async (req, res) => {
    const token = req.nat;
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    console.log(client)
    if(client && order && client.active_orders.includes(orderId) && order.status==6){
        try{
            order.status = 7;
            await order.save();
            const travelerId = order.traveler;
            const traveler = await Traveler.findById(travelerId);
            const prodId = order.item;
            const prod = await Product.findById(prodId);

            let index = traveler.assigned_orders.indexOf(orderId);
            if (index !== -1) {
                traveler.assigned_orders.splice(index, 1);
            }
            traveler.completed_orders.push(orderId);
            let indexc = client.active_orders.indexOf(orderId);
            if (indexc !== -1) {
                client.active_orders.splice(indexc, 1);
            }
            client.completed_orders.push(orderId);
            await client.save();
            if(traveler.new_orders.length==0 && traveler.assigned_orders.length==0){
                traveler.active = false;
                traveler.provided_pickup = "";
            }
            await traveler.save();
            sendCompletiontoTraveler(traveler.email, traveler.name, traveler.lastname, prod.title);

            res.status(200).json( {message: 'Successfully Comepleted Order', token});
        }catch(err){
            console.log(err);
        }
    }else{
        res.status(404).json( { message: 'Client or Order Not Found', token})
    }
}

/*The getProfile function first extracts the clientId and token from the HTTP request.
It then uses the clientId to retrieve the client object from the database.
If the client object exists, the function sends an HTTP response with a status code of 200 and a JSON object containing the client object and the authentication token.
If the client object does not exist, the function sends an HTTP response with a status code of 400 and a message indicating that something went wrong.*/
module.exports.getProfile = async (req, res) => {
    const clientId = req.userId;
    const token = req.nat;
    const client = await User.findById(clientId);
    if(client){
        console.log(client)
        res.status(200).send({client, token});
    }
    else{
    res.status(400).json( {message: 'Something went wrong', token} )
    }
}

/*The editProfile function first extracts the clientId and token from the HTTP request. It then uses the clientId to retrieve the user object from the database. 
If the user object exists, the function attempts to update the user's document with the new profile information contained in the request body. 
If the update is successful, the function sends a JSON response with the updated user document and the authentication token. If an error occurs during the update process, 
the function sends a JSON response with a status code of 500 and the error message. If the user object does not exist, the function sends a JSON response with a status 
code of 500 and an error message.*/
module.exports.editProfile = async (req, res) => {
    const clientId = req.userId;
    const token = req.nat;
    const client = await User.findById(clientId);
    if(client){
        try {
            const user = await User.findByIdAndUpdate(clientId, req.body, { new: true });
            res.send({user, token});
          } catch (error) {
            res.status(500).send(error);
          }
    }else{
        res.status(500).send(error);
    }
}

/*The changePass_post function first extracts the token, password, newPassword, and clientId from the HTTP request.
It then uses the clientId to retrieve the client object from the database.
If the client object exists, the function compares the old password with the password stored in the database using bcrypt.compare. 
If the passwords match, the function generates a salt using bcrypt.genSalt and hashes the new password using bcrypt.hash. 
The function then saves the hashed password to the client object and returns an HTTP response with a status code of 200 and a message indicating that the password 
has been successfully changed.
If the passwords do not match, the function returns an HTTP response with a status code of 500 and a message indicating that the old password is incorrect.
If an error occurs during the execution of the function, the function returns an HTTP response with a status code of 500 and a message indicating that the password 
could not be changed.*/
module.exports.changePass_post = async (req, res) => {
    console.log('hi')
    const token = req.nat;
    const password = req.body.password;
    const newPassword = req.body.password2;
    const clientId = req.userId;
    const client = await User.findById(clientId);
    console.log(clientId);
    if(client){
        try{
            console.log('test')
            const auth = await bcrypt.compare(password, client.password);
            if(auth){
                console.log('processing...')
                bcrypt.genSalt(10, function(err, salt){
                    if(err){
                        console.log(err);
                        res.status(500).json({message: 'Server Occured', token});
                        return;
                    }
                    console.log('hello')
                    bcrypt.hash(newPassword, salt, async function(err, hash){
                        client.password = hash;
                        client.save();
                        return res.status(200).json({message: 'Successfully changed password', token})
                    })
                })
            }else{
                return res.status(500).json({message: 'Incorrect Password', token});
            }
            
        }catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Occured', token});
    }
}
}

/*The getRate_get function first creates an options object containing the URL of the website to fetch the exchange rate and other options. 
It then uses the request module to send a request to the website and fetches the HTML response. The cheerio module is used to parse the HTML 
response and extract the latest exchange rate. The extracted rate is then returned in a JSON object in the HTTP response. If an error occurs during the execution 
of the function, it sends an HTTP response with a status code of 400 and an error message. */
module.exports.getRate_get = async (req, res) => {
    try{
    const options = {
        url: "https://lirarate.org/",
        gzip: true,
      };
      request(options, function(err, res1, html){
        let $ = cheerio.load(html);
        
        const buyrate = $("p[id='latest-buy']").text().trim();
        const rate = buyrate.replace(/\D/g, '').substring(1);
        
        console.log(rate);
        res.send({rate: rate});
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error Occured' });
    }
}

/*The giveFeedback_post function first extracts the token and orderid from the HTTP request. It then uses the orderid to retrieve the order object from the database. 
If the order object is found, the function creates a Feedback object using the feedback data from the request body. It then updates the order's feedback field with the 
ID of the newly created Feedback object and saves the order object to the database. Finally, the function sends an HTTP response indicating whether the feedback was added 
successfully or not. If an error occurs during the execution of this function, the function sends an HTTP response with an appropriate error message and status code. */
module.exports.giveFeedback_post = async(req, res) => {
    console.log("FEEDBACK")
    const token = req.nat;
    const orderId = req.params.orderid;
    const order = await Order.findById(orderId);
    const { rating, arrived_on_time, as_described, good_service, message } = req.body;
    if (order){
        try{
            const feedback = await Feedback.create({order: orderId, rating, arrived_on_time, as_described, good_service, message});
            order.feedback = feedback._id;
            await order.save();
            res.status(201).json({message: 'Feedback added successfully', token});
        }
        catch(err){
            console.log(err);
            res.status(500).json({message: 'Server Error Occured', token});
        }
    }
    else{
        res.status(404).json({message: 'Order not Found.', token})
    }
}

/*The submitContactForm function first extracts the clientId and token from the HTTP request.
It then uses the clientId to retrieve the client object from the database.
If the client is found, the function tries to extract the email, team, subject, and message from the HTTP request and creates a new ContactForm object with this data.
If the ContactForm object is successfully created, the function sends an HTTP response with a status code of 200 and a success message containing the authentication token.
If an error occurs during the execution of the function, the function sends an HTTP response with a status code of 400 and a message indicating that something went wrong. 
If the client is not found, the function sends an HTTP response with a status code of 404 and a message indicating that the client could not be found.*/
module.exports.submitContactForm = async(req, res) => {
    const clientId = req.userId;
    const client = await User.findById(clientId);
    const token = req.nat;
    if(client){
        try{
            const email = req.body.email;
            const team = req.body.team;
            const subject = req.body.subject;
            const message = req.body.message;

            const contactForm = new ContactForm({
            email, team, subject, message
            }); 

            contactForm.save().then(() => {
                return res.status(200).json({message: 'Successfully Submitted Contact Form', accessToken: token})
            })

        }catch(err){
            console.log(err);
            return res.status(400).json({ message: 'Something went wrong.', token})
        }

    }else{
        return res.status(404).json({message: 'Client not found', token})
    }
}

/*The function first extracts the clientId and token from the HTTP request.
It then retrieves the client or traveler object from the database using the clientId.
If the object is a traveler, the function constructs an email message and sends it to the support team.
If the object is a client, the function constructs an email message and sends it to the support team.
If the email is sent successfully, the function sends an HTTP response with a status code of 200 and a success message and token.
If the email fails to send, the function sends an HTTP response with a status code of 400 and an error message and token.
 */
module.exports.submitSupportForm = async(req, res) => {
    const clientId = req.userId;
    const type = req.userType
    const token = req.nat;
    try{
        const client = await User.findById(clientId);
        if(!client){
            const trav = await Traveler.findById(clientId);
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: 'tou.lebanon@gmail.com', // recipient's email address
                subject: req.body.subject,
                text: 'TRAVELER SUPPORT\n\n' + 'traveler('+ clientId +'):\nemail:'+trav.email+'\n\n' + 'message:\n'+req.body.message
                };
                await new Promise((resolve, reject) => {
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            reject(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                            resolve();
                        }
                    });
                });
                return res.status(200).send({message: 'Successfully Submitted Support Form', token, type})
        }
        else{
            let mailOptions = {
                from: 'donotreply.tou.lebanon@outlook.com', // your email address
                to: 'tou.lebanon@gmail.com', // recipient's email address
                subject: req.body.subject,
                text: 'CLIENT SUPPORT\n\n' + 'client('+ clientId +'):\nemail:'+client.email+'\n\n' + 'message:\n'+req.body.message
                };
                await new Promise((resolve, reject) => {
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            reject(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                            resolve();
                        }
                    });
                });
            return res.status(200).send({message: 'Successfully Submitted Support Form', token, type})
        }
    }
    catch(err){
        console.log(err);
        return res.status(400).send({message: 'Something went wrong.', token})
    }
}