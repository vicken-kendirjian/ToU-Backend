//these are handle functions
const Traveler = require('../models/Traveler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
// const bodyParser = require('body-parser');

let transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: 'donotreply.tou.lebanon@outlook.com', // your email address
      pass: '*31&pCbE' // your email password
    }
});

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

/*The `tsignup_post` function first logs the body of the HTTP request to the console.
It then creates a new instance of the `multer` middleware to handle file uploads, specifying that files should be stored in a specific S3 bucket and assigning 
them unique filenames based on the current date and original filename.
The function then calls the `upload.fields` method to handle the file uploads, passing in an array of objects containing the names of the expected files. 
If an error occurs during the upload process, the function sends an HTTP response with a status code of 400 and a message indicating the error.
If the upload is successful, the function extracts the user's personal information from the `otherData` property of the request body and checks whether a user or 
traveler with the same email address already exists in the database. If so, the function sends an HTTP response with a status code of 406 and a message indicating 
that the email already exists.
If the email is unique, the function creates a new `Traveler` object with the provided personal information and assigns the uploaded files to the `cv` and `identification` 
properties of the object. The function then saves the new `Traveler` object to the database.
The function then composes an email message acknowledging receipt of the user's application and sends it using the configured `transporter` object. Finally, the function 
sends an HTTP response with a status code of 200 and the newly created `Traveler` object. If an error occurs at any point during the execution of the function, the function 
logs the error to the console and sends an HTTP response with a status code of 400 and a message indicating that the registration could not be completed.*/
module.exports.tsignup_post = async (req, res) => {
    console.log(req.body);
    const date = Date.now();
    const upload = multer({
        storage: multerS3({
            bucket:BUCKET,
            s3:s3,
            acl:'public-read',
            key:(req, file, cb) => {
                const filename = date + "-" + file.originalname;
                cb(null, filename);
            }
        })
    })
    upload.fields([{ name: 'cv' }, { name: 'id' }])(req, res, async (err) => {
        if (err) {
          console.log(err);
          return res.status(400).send({ error: err.message });
        }
    try{
        const data = await JSON.parse(req.body.otherData);
        const user = await User.findOne({email: data.email});
        const trav = await Traveler.findOne({email: data.email})
        if(user || trav){
            return res.status(406).send({error: 'Email already exists'});
        }
        const { name, lastname, gender, phone_number, nationality, email} = data;
        const traveler = await Traveler.create({ name, lastname, gender, phone_number, nationality, email, approved: false});
        traveler.cv = req.files['cv'][0].key;
        traveler.identification = req.files['id'][0].key;
        await traveler.save();
        let mailOptions = {
            from: 'donotreply.tou.lebanon@outlook.com', // your email address
            to: email, // recipient's email address
            subject: 'ToU Traveler Registration',
            text: 'Dear ' + name + ' ' + lastname + ',\n\n' + 'Thank you for applying to be a traveler with ToU. Your application has been received and will be reviewed by our team. You will be notified by email once your application has been approved.\n\n' + 'Best regards,\n' + 'ToU Team'
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
        res.status(200).send(traveler);
    }catch (err){
        console.log(err);
        res.status(400).send({result : false});
    }
    });
};