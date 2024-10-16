const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    pdf_file: {
        type: String,

    },
    departure: {
        type: String,
        default: ""
    },
    return: {
        type: String,
        default: ""
    },
    departure_flight: {
        type: String,
        default: ""
    },
    return_flight: {
        type: String,
        default: ""
    },
    ticket_name:{
        type: String, 
        default: ""
    },
    traveler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Traveler'
    }

})

const Ticket = mongoose.model('ticket', ticketSchema);

module.exports = Ticket;