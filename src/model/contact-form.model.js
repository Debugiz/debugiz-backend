const mongoose = require('mongoose');

const ContactFormSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    message: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const ContactForm = mongoose.model('ContactForm', ContactFormSchema);

module.exports = ContactForm;