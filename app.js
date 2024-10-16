const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/AuthRoute');
// const productRoutes = require('./routes/productRoute');
const TravRoutes = require('./routes/TravelerRoute');
const AdminRoute = require('./routes/AdminRoute');
const ClientRoute = require('./routes/ClientRoute');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/Middleware');
const cors = require('cors');
// const bodyParser = require('body-parser');
const Admin = require('./models/Admin')
const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// middleware
app.use(express.static('public'));
app.use(express.json());//takes any json obj that comes with a req and parses it for us so we can use it.
app.use(cookieParser());

// database connection
mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://vickenk8:lF4PbJg2PKGljdDM@cluster0.3zxbi6j.mongodb.net/test", {useNewUrlParser: true, useUnifiedTopology: true});



app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'exp://192.168.16.101:19001/');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
//responsible for setting specific HTTP headers in the response that will allow clients to access resources from this server.
app.use(cors());

// routes
app.use(authRoutes);
app.use(TravRoutes);
app.use(AdminRoute);
app.use(ClientRoute);

app.listen(5000, function(){
    console.log("Express server listening on port 5000");
})

