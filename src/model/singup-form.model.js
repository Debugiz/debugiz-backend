const mongoose = require('mongoose');

const SignupFormSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const SignupForm = mongoose.model('SignupForm', SignupFormSchema);

module.exports = SignupForm;