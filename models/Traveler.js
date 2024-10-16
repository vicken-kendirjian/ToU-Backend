const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');


 
const travelerSchema = new mongoose.Schema({
  email:{
      type: String,
      required: [true, 'Please enter an email'],//the second entry in this array is the custom error message
      unique: true,
      lowercase: true
  },
  password: {
      type: String,
      required: [true, 'Please enter a password'],
      default: 'Password',
  },
  name: {
    type: String
  },
  lastname: {
    type: String
  },
  gender: {
    type: String
  },
  phone_number: {
    type: String
  },
  nationality: {
    type: String
  },
  cv: {
    type: String
  },
  identification:{
    type: String
  },
  reviewed:{
    type: Boolean,
    default: false
  },
  active: {
      type: Boolean,
      default: false
  },
  approved: {
    type: Boolean,
    default: false
  },
  failed_login_attempts:{
    type: Number,
    default: 0
  },
  locked_until: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'Traveler'
  },
  new_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  assigned_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  completed_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],                                                        
  canceled_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  provided_pickup: {
    type: String,
    default: ""
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  revoked: {
    type: Boolean,
    default: false
  }
  
});

// travelerSchema.pre('save', async function(next) {//didnt use arrow function so that we could use this
//   //console.log('user about to be created and saved', this);  //refers to the that we are trying to create 'await User.create...' before it is saved in db, note that it wont take __V cz not saved yet
//   const salt = await bcrypt.genSalt();
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

//Get Available/Unavailable travelers
travelerSchema.statics.getListOfAvailableTravelers = async function() {
    const list = await this.find({ active: true }).select('_id name');
    return list.map(traveler => {
      return {
        id: traveler._id,
        name: traveler.name
      }
    });
  };

travelerSchema.statics.getListOfUnavailableTravelers = async function() {
    const list = await this.find({ active: false }).select('_id name');
    return list.map(traveler => {
      return {
        id: traveler._id,
        name: traveler.name
      }
    });
  };

travelerSchema.statics.getListOfAllTravelers = async function(){
  const list = await this.find();
  return list;
}//chris

//Get Travelers that have recently applied to approve or reject
travelerSchema.statics.getNewTravelers = async function(){
  const list = await this.find({ approved: false});
  return list;
}


//Get A Travelers Profile
travelerSchema.statics.getTravelerProfile = async function (email){
    const traveler = await Traveler.findOne({email: email});
    return traveler;
}

//Delete a Traveler from db
travelerSchema.statics.deleteTraveler = async function(id){
    const traveler = await Traveler.findById(id);
    if(traveler){
        await Traveler.findByIdAndDelete(id);
        console.log("Traveler with id "+id+" has been deleted successfully");
    }
    else{
        console.log("Traveler not found");
    }
}



travelerSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  
  if (user && Date.now() > user.locked_until) {
    const auth = await bcrypt.compare(password, user.password);
    console.log(auth);
    
    if (auth) {
      console.log("Correct");
      await Traveler.findOneAndUpdate(
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
      await Traveler.findOneAndUpdate(
        { email: user.email },
        { failed_login_attempts: user.failed_login_attempts }
    );
      if(user.failed_login_attempts < 5){
        throw Error('incorrect password');
      }else if (user.failed_login_attempts >= 5){
        const blocked_until = new Date(Date.now() + (10*60*1000));
        await Traveler.findOneAndUpdate(
          { email: user.email },
          { locked_until: blocked_until }
        );
        console.log(user.email+" has been blocked until: "+blocked_until);
      }
    }
    
  }
  else if(user && Date.now() < user.locked_until){
    throw Error('user blocked');
  }
  throw Error('incorrect email');
};





const Traveler = mongoose.model('traveler', travelerSchema);


module.exports = Traveler;