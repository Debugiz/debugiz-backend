const mongoose = require('mongoose');

const SignupFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  
});


const SignupForm = mongoose.model('SignupForm', SignupFormSchema);

module.exports = SignupForm;