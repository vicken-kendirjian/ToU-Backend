const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    title:{
        type: String,
    },
    asin:{
        type: String,
    },
    price:{
        type: String,
        default: ""
    },
    dimensions:{
        type: String
    },
    weight: {
        type: Number
    },
    length: {
        type: Number
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    inStock:{
        type: Boolean
    },
    url:{
        type: String
    },
    quantity_ordered:{
        type: Number
    },
    image:{
        type: String
    }
})





const Product = mongoose.model('product', productSchema);

module.exports = Product;