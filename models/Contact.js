const mongoose = require('mongoose');

const ContactFormSchema = new mongoose.Schema({
    email:{
        type: String
    },
    team:{
        type: String
    },
    subject:{
        type: String
    },
    message:{
        type: String
    }


})

const ContactForm = mongoose.model('contact', ContactFormSchema);

module.exports = ContactForm;