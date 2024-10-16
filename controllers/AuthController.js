//these are handle functions
const User = require('../models/User');
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Token = require('../models/Token');
const Admin = require('../models/Admin')
require('dotenv').config();



let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
  });

  const handleErrors = (err) => {
    //console.log(err.message, err.code);//err.code is for the user
    let errors = {
        email: '', password: ''
    }//populate this with an email error and a password error from 'err' (check in terminal)
    //incorrect email
    if(err.message === 'incorrect email'){
        errors.email = 'that email is not registered'
    }
    //Unverified email
    if(err.message === 'email not verified'){
        errors.email = 'email is not verified'
    }
    //incorrect password
    if(err.message === 'incorrect password'){
        errors.password = 'that password is incorrect';
    }
    //account blocked
    if(err.message === 'user blocked'){
        errors.email = 'This account has been freezed due to excess of failed login attempts. Try again later.'
        return errors;
    }
    //duplicate error code
    if(err.code===11000){
        errors.email = 'that email is already registered';
        return errors;
    }
    //validation errors
     if(err.message.includes('user validation failed')){
        //console.log(err); in the terminal, an error object will be returned, this is the object we want to tackle
        //console.log(Object.values(err.errors))//Object.values is used to only get the values of specified attribute that will be inside the 'properties' field.
        
        Object.values(err.errors).forEach(({properties}) => {   //similar to forEach(err) then err.properties
            errors[properties.path] = properties.message;
        })   
    }
    return errors;
}



const createEmailLink = (id) => {
    const emailToken = jwt.sign({id}, process.env.SECRET_EMAIL, {expiresIn: '2d'});
    const link = "http://localhost:5000/confirm-email/"+id+"/"+emailToken;
    return link;
}

const sendEmail = async (email, name, lastname, link) => {
    let mailOptions = {
        from: 'donotreply.tou.lebanon@outlook.com', // your email address
        to: email, // recipient's email address
        subject: 'ToU: Email Confirmation',
        text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'Please click on the link to confirm your email.\n\n' + 'Best regards,\n' + link
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


const createAccessToken = (id, userType) => {
    const expiresIn = '2m'; // Access token expires in 1 hour
    const secret = process.env.SECRET_JWT;
    const token = jwt.sign({ id, userType }, secret, { expiresIn });
    return token;
};
  
const createRefreshToken = (id, userType) => {
  const expiresIn = '7d'; // Refresh token expires in 7 days
  const secret = process.env.SECRET_REFRESH_JWT;
  const token = jwt.sign({ id, userType }, secret, { expiresIn });
  return token;
};


/*The singup_post function first extracts the user's information from the HTTP request body.
It then checks whether the user's email already exists in the database. If it does, the function sends an HTTP response with 
a status code of 418 and a message indicating that the user already exists.
If the user's email is not in the database, the function creates a new user account by calling the User.create function with the user's information. 
The function then generates an email verification link for the user and sends an email to the user's email address. Finally, the function sends an HTTP 
response with a status code of 201 and a JSON object containing the ID of the newly created user account. If an error occurs during the creation of the user account, 
the function catches the error, generates an error message using the handleErrors function, and sends an HTTP response with a status code of 400 and a JSON object 
containing the error message.*/
module.exports.singup_post = async (req, res) => {
  console.log('SIGN UP')
  const { email, password, name, lastname, nationality, gender, city, phone_number } = req.body;
  const found = await Traveler.findOne({email});
  if(found){
      return res.status(418).json(found.type);
  }
  

  try{
      const user = await User.create({email, password, name, lastname, nationality, gender, phone_number, city, type: "User"});
      
      const emailLink = createEmailLink(user._id);
      sendEmail(email, name, lastname, emailLink);
      res.status(201).json({user: user._id});//Send response with 201 status then send back user as json
  }catch(err){
      console.log(err);
      const errors = handleErrors(err);
      res.status(400).json({ errors });
  }//if email and pass were left empty, error would be generated (by mongoose) since they are both required
}

/*The login_post function first extracts the email and password from the HTTP request body. If the user is a traveler and their account has not been approved, 
the function returns an HTTP response with a status code of 400 and a message indicating that the account has not been approved. If the user is a traveler and 
their account has been revoked, the function returns an HTTP response with a status code of 400 and a message indicating that the account has been revoked. If the user 
is a registered user but has not yet confirmed their email, the function returns an HTTP response with a status code of 406 and a message indicating that the user should 
confirm their email. If the email and password are valid and the user has been authenticated, the function creates an access token and a refresh token for the user, saves 
the tokens to the database, and returns an HTTP response with a status code of 200 and the user's ID, type, and access token in JSON format. If an error occurs during the 
execution of the function, the function catches the error, handles it, and returns an HTTP response with a status code of 400 and the error message in JSON format. */
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try{
      
      const user = await User.login(email, password);
      console.log(user);
      if(user && !user.valid_e){
        return res.status(406).json({message: 'The email is not yet confirmed'})
      }
      if(user){
        const accessToken = createAccessToken(user._id, user.type);
        const refreshToken = createRefreshToken(user._id, user.type);
        const ARtoken = new Token({
            user: user._id,
            refreshToken: refreshToken,
            accessToken: accessToken,
            type: user.type
        })
        ARtoken.save();
        res.status(200).json({user: user._id, type: user.type, token: accessToken});
      }
      else{
          console.log('hi traveler');
          const traveler = await Traveler.findOne({email: email});
          console.log(email);
          if(traveler){
            if(traveler.approved==false){
              res.status(400).json({ message: 'This account has still to be approved by the admin'});
              return;
            }
            const trav = await Traveler.login(email, password);
            if(trav.revoked){
            return res.status(400).json({message: 'This account has been revoked by the admin'})
            }
            if(trav){
            const accessToken = createAccessToken(trav._id, trav.type);
            const refreshToken = createRefreshToken(trav._id, trav.type);
            const ARtoken = new Token({
                user: trav._id,
                refreshToken: refreshToken,
                accessToken: accessToken,
                type: trav.type
            })
            ARtoken.save();
            res.status(200).json({user: trav._id, type: trav.type, token: accessToken});
            }
          }
          else{
            console.log('Hi admin')
            const admin = await Admin.login(email, password);
            console.log('Hellooo')
            if(admin){
              const accessToken = createAccessToken(admin._id, admin.type);
              const refreshToken = createRefreshToken(admin._id, admin.type);
              const ARtoken = new Token({
                  user: admin._id,
                  refreshToken: refreshToken,
                  accessToken: accessToken,
                  type: admin.type
              })
              ARtoken.save();
              res.status(200).json({user: admin._id, type: admin.type, token: accessToken});
            }
          }
      }
      
  }catch(err){
    console.log(err);
      const errors = handleErrors(err);
      if(err.message == 'user blocked'){
          res.status(403).json(errors);
      }
      else res.status(400).json({ errors });
  }
}

/*The confirmEmail_get function first extracts the id and token from the HTTP request parameters.
It then verifies the token using the secret email key.
If the token is valid, the function retrieves the user object from the database and updates the user's valid_e field to true. 
The function then sends an HTTP response with a message indicating that the email has been successfully confirmed.
If the token is invalid, the function sends an HTTP response with a message indicating that an error has occurred.*/
module.exports.confirmEmail_get = async (req, res) => {
    console.log("hi")
    const id = req.params.id;
    const token = req.params.token;
    const secret = process.env.SECRET_EMAIL;
    const payload = jwt.verify(token, secret);
    if(payload){
        const user = await User.findByIdAndUpdate(id, { valid_e: true }, { new: true });
        console.log(user);
        res.send("Successfully Confirmed Email");
    }
    else res.send("Error Occured");
}


  /*The logout_post function first extracts the access token from the HTTP request header.
  It then deletes the access token from the database using the Token model's deleteOne method.
  If the deletion is successful, the function sends an HTTP response with a status code of 200 and a message indicating that the user has been successfully logged out. 
  If an error occurs during the execution of the function, the function catches the error, logs it to the console, and sends an HTTP response with a status code of 500 
  and a message indicating that there was an error logging out.*/
  module.exports.logout_post = async (req, res) => {
    try {
      // get the user's refresh token from the request header
      const accessToken = req.headers.authorization.split(' ')[1];
      
      // delete the refresh token from the database
      await Token.deleteOne({ accessToken });
  
      // send a successful response
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error logging out' });
    }
  };










//   const token = createToken(user._id);
        //   res.cookie('uauthjwt', token, {httpOnly: true, maxAge: maxAge*1000});//storing the token in the browser
        //   res.status(200).json({user: user._id, type: user.type});