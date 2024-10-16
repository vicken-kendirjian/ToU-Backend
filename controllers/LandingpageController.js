const Feedback = require('../models/Feedback');

/*The testimonials_get function first retrieves all feedbacks marked as testimonials from the database using the Feedback model.
If there are testimonials, the function sends an HTTP response with a status code of 200 and a JSON object containing the testimonials array.
If there are no testimonials, the function sends an HTTP response with a status code of 404 and a message indicating that no testimonials were found.
If an error occurs during the execution of this function, the function sends an HTTP response with a status code of 500 and a message indicating the error.*/
module.exports.testimonials_get = async (req, res) => {
    try {
        const testimonials = await Feedback.find({ testimonial: true });
        if (testimonials){
            res.status(200).json({ testimonials });
        }
        else{
            res.status(404).json({ message: 'No testimonials found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}