const mongoose = require('mongoose');

const SignupFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  dob: { type: Date },
  degree: { type: String },
  yop: { type: String },
  fatherContact: { type: String },
  motherContact: { type: String },
  experienceType: { type: String, enum: ['Fresher', 'Experienced'], default: 'Fresher' },
  imageUrl: { type: String }, // for profile image

  dateOfJoining: { type: Date },
  referenceDetail: { type: String },
  documentSubmission: { type: Boolean, default: false },
  initialAmount: { type: Number },
  totalAmount: { type: Number },
  courseSelection: { type: String },
  team: { type: String },

  // Optional if selected in company
  isPlaced: { type: Boolean, default: false },
  companyName: { type: String },
  packageName: { type: String },
  amountPaidStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
  submittedAt: { type: Date, default: Date.now },

  // Optional fields for forgot-password flow
  resetOtp: { type: Number, required: false },
  otpExpiry: { type: Date, required: false }
});


const SignupForm = mongoose.model('SignupForm', SignupFormSchema);

module.exports = SignupForm;