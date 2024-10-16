const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: [true, 'Please enter an email'],//the second entry in this array is the custom error message
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']//isEmail returns either true or false
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [2, 'Minimum password length is  characters']
    },
    name: {
      type: String
    },
    lastname: {
      type: String
    },
    nationality: {
      type: String
    },
    phone_number: {
      type: String
    },
    failed_login_attempts:{
      type: Number,
      default: 0
    },
    locked_until: {
      type: Number,
      default: 0
    },
    city: {
      type: String
    },
    gender: {
      type: String
    },
    valid_e: {
      type: Boolean,
      default: false
    },
    type: {
      type: String
    },
    completed_orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }], 
    active_orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    pending_orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }]     
})

//fire a function after doc saved to db
// userSchema.post('save', function (doc, next){
//     console.log("new user was created and saved", doc);
//     next();//to keep going
// });

//fire a function before doc saved to db
userSchema.pre('save', async function(next) {//didnt use arrow function so that we could use this
    //console.log('user about to be created and saved', this);  //refers to the that we are trying to create 'await User.create...' before it is saved in db, note that it wont take __V cz not saved yet
    if (!this.isNew) {
      return next();
    }
    
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


//method to login user
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if(!user) return false;
  if (user && Date.now() > user.locked_until && user.valid_e == true) {
    const auth = await bcrypt.compare(password, user.password);
    console.log(auth);
    
    if (auth) {
      console.log("Correct");
      await User.findOneAndUpdate(
        { email: user.email },
        { failed_login_attempts: 0, locked_until: 0 }
    );
      return user;
    }
    
    else if(!auth){
      console.log("incrementing failed attempts for "+user.email)
      user.failed_login_attempts+=1;
      console.log(user.failed_login_attempts);
      user.password = user.password;
      await User.findOneAndUpdate(
        { email: user.email },
        { failed_login_attempts: user.failed_login_attempts }
      );
      if(user.failed_login_attempts < 5){
        throw Error('incorrect password');
      }else if (user.failed_login_attempts >= 5){
        const blocked_until = new Date(Date.now() + (10*60*1000));
        await User.findOneAndUpdate(
          { email: user.email },
          { locked_until: blocked_until }
        );
        console.log(user.email+" has been blocked until: "+blocked_until);
        throw Error('user blocked');
      }
    }
    
  }
  else if(user && Date.now() < user.locked_until){
    throw Error('user blocked');
  }
  else if(user.valid_e == false){
    throw Error('email not verified');
  }
  throw Error('incorrect email');
};


const User = mongoose.model('user', userSchema);

module.exports = User;