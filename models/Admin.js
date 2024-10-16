const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const adminSchema = new mongoose.Schema({
    username: {
        type: String
    },
    password:{
        type: String
    },
    type: {
        type: String,
        default: 'Admin'
    }
})

adminSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
      }
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


adminSchema.statics.login = async function(email, password) {
    const admin = await this.findOne({ email });
    if(!admin) return false;
    const auth = await bcrypt.compare(password, admin.password);
    if(auth) return admin;
    else{
        throw Error('incorrect password');
    }
  };


const Admin = mongoose.model('admin', adminSchema);

module.exports = Admin;