const mongoose = require('mongoose');

const generalSchema = new mongoose.Schema({
    total_earnings:{
        type: Number,
        default: 0
    },
    completed_orders_num:{
        type: Number,
        default: 0
    }
});

const General = mongoose.model('general', generalSchema);

module.exports = General;