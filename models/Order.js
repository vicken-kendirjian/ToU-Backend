const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Traveler = require('../models/Traveler');

const orderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    traveler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Traveler',
        default: null
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number
    },
    status: {
        type: Number,
        default: 0
    },
    waiting_resp: {
        type: Boolean,
        default: false
    },
    proof: {
        type: String
    },
    estimated_arrival: {
        type: String
    },
    ticket:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    pickup_location:{
        type: String
    },
    cost: {
        type: Number
    },
    total_weight: { //weight*quantity
        type: Number
    },
    receipt: {
        type: String
    },
    a_commission: {
        type: Number
    },
    t_commission: {
        type: Number
    },
    client_confirmed:{
        type: Boolean,
        default: false
    },
    feedback:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }
});

const Order = mongoose.model('order', orderSchema);

module.exports = Order;
