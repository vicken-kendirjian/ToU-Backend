const mongoose =  require('mongoose');

const feedbackSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    message: {
        type: String
    },
    rating: {   //0-5
        type: Number,
        required: [true, 'Please enter a rating']
    },
    arrived_on_time: {
        type: Boolean,
    },
    as_described: {
        type: Boolean,
    },
    good_service: {
        type: Boolean,
    },
    testimonial:{
        type: Boolean
    }
})

const Feedback = mongoose.model('feedback', feedbackSchema);

module.exports = Feedback;