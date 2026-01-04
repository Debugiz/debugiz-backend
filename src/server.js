const express = require("express");
const dotenv = require("dotenv");
const ContactForm = require("./model/contact-form.model");
const connectDB = require("./db/db");
const XLSX = require("xlsx");
const cors = require("cors");
const SignupForm = require("./model/singup-form.model");
const nodemailer = require("nodemailer");
const app = express();
dotenv.config();
connectDB();
const bcrypt = require("bcryptjs");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const jwt = require("jsonwebtoken");
const authMiddleware = require("./auth/auth.middleware");

const PORT = process.env.PORT || 2000;

app.post("/api/v1/contact-submit",authMiddleware, async (req, res) => {
  const { name, email, contactNumber, Dob, Yop, Degree, Address, Experience } =
    req.body;

  const requiredFields = [
    "name",
    "email",
    "contactNumber",
    "Dob",
    "Yop",
    "Degree",
    "Address",
    "Experience",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length !== 0) {
    return res
      .status(400)
      .json({
        code: 400,
        message: "Please provide all required fields",
        missingFields,
      });
  }

  try {
    const contactForm = new ContactForm({
      name: name[0].toUpperCase() + name.slice(1),
      email,
      contactNumber,
      Dob,
      Yop,
      Degree,
      Address,
      Experience,
    });

    await contactForm.save();
    res.status(200).json({ code: 200, message: "Message sent successfully" });
  } catch (err) {
    console.error("Error saving form:", err);
    res.status(500).json({ code: 500, message: "Error saving form data" });
  }
});
app.get("/api/v1/contact-download", async (req, res) => {
  if (req.query.password !== process.env.PASSWORD) {
    return res
      .status(401)
      .json({ code: 401, message: "Unauthorized: Incorrect password" });
  }
  try {
    const forms = await ContactForm.find();
    if (forms.length === 0) {
      return res.status(404).json({ code: 404, message: "No data found" });
    }
    const formattedData = forms.map((entry) => ({
      Name: entry.name,
      Email: entry.email,
      "Contact Number": entry.contactNumber,
      Message: entry.message,
      Dob: entry.Dob,
      Yop: entry.Yop,
      Degree: entry.Degree,
      Address: entry.Address,
      Experience: entry.Experience,
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: [
        "Name",
        "Email",
        "Contact Number",
        "Dob",
        "Yop",
        "Degree",
        "Address",
        "Experience",
      ],
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Data");
    worksheet["!cols"] = [
      {
        wch:
          Math.max(...formattedData.map((row) => (row.Name || "").length), 10) +
          5,
      },
      {
        wch:
          Math.max(
            ...formattedData.map((row) => (row.Email || "").length),
            10
          ) + 5,
      },
      {
        wch:
          Math.max(...formattedData.map((row) => (row.Dob || "").length), 10) +
          5,
      },
      {
        wch:
          Math.max(...formattedData.map((row) => (row.Yop || "").length), 10) +
          5,
      },
      {
        wch:
          Math.max(
            ...formattedData.map((row) => (row.Degree || "").length),
            10
          ) + 5,
      },
      {
        wch:
          Math.max(
            ...formattedData.map((row) => (row.Address || "").length),
            10
          ) + 5,
      },
      {
        wch:
          Math.max(
            ...formattedData.map((row) => (row.Experience || "").length),
            10
          ) + 5,
      },
      {
        wch:
          Math.max(
            ...formattedData.map((row) => (row["Contact Number"] || "").length),
            10
          ) + 5,
      },
    ];

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true,
    });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="debugiz-contact-form.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Error generating Excel:", err);
    res.status(500).json({ code: 500, message: "Error generating Excel file" });
  }
});

function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}


async function sendPasswordEmail(email, password) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or any SMTP service you use
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password-or-app-password',
    },
  });

  const mailOptions = {
    from: '"Your App" <your-email@gmail.com>',
    to: email,
    subject: 'Your Account Password',
    text: `Welcome! Your password is: ${password}. Please change it after login.`,
  };

  await transporter.sendMail(mailOptions);
}

app.post("/api/v1/signup", async (req, res) => {
  const { name, email, contactNumber,password, role } = req.body;

  const requiredFields = ["name", "email", "contactNumber","password" ,"role"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length !== 0) {
    return res.status(400).json({
      code: 400,
      message: "Please provide all required fields",
      missingFields,
    });
  }

  try {
    // Generate password automatically
    const rawPassword = generateRandomPassword();

    // Hash the generated password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const signup = new SignupForm({
      name: name[0].toUpperCase() + name.slice(1),
      email,
      contactNumber,
      password:hashedPassword,
      role,
    });

    await signup.save();

    // Send password via email
    // await sendPasswordEmail(email, rawPassword);

    res.status(200).json({
      code: 200,
      message: "User signed up successfully. Password sent to email.",
    });
  } catch (err) {
    console.error("Error saving form:", err);
    res.status(500).json({ code: 500, message: "Error saving form data" });
  }
});

app.post("/api/v1/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      code: 400,
      message: "Please provide both email and password",
    });
  }

  try {
    const user = await SignupForm.findOne({ email });
    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ code: 401, message: "Invalid credentials" });
    }

    // ✅ CREATE JWT TOKEN
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      code: 200,
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});

app.get("/api/v1/user-details",authMiddleware, async (req, res) => {
  try {
    const forms = await SignupForm.find();

    if (forms.length === 0) {
      return res.status(404).json({ code: 404, message: "No user data found" });
    }

    const formattedData = forms.map((entry) => ({
  id: entry._id,
  name: entry.name,
  email: entry.email,
  contactNumber: entry.contactNumber,
  role: entry.role,
  dob: entry.dob,
  degree: entry.degree,
  yop: entry.yop,
  fatherContact: entry.fatherContact,
  motherContact: entry.motherContact,
  experienceType: entry.experienceType,
  imageUrl: entry.imageUrl,
  dateOfJoining: entry.dateOfJoining,
  referenceDetail: entry.referenceDetail,
  documentSubmission: entry.documentSubmission,
  initialAmount: entry.initialAmount,
  totalAmount: entry?.totalAmount,
  courseSelection: entry?.courseSelection,
  team: entry?.team,
  isPlaced: entry?.isPlaced,
  companyName: entry?.companyName,
  packageName: entry?.packageName,
  amountPaidStatus: entry?.amountPaidStatus,
  submittedAt: entry?.submittedAt
}));


    return res.status(200).json({
      code: 200,
      message: "User data fetched successfully",
      data: formattedData,
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});
app.put("/api/v1/user-details/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, contactNumber, role } = req.body;

  try {
    const user = await SignupForm.findById(id);

    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }

    if (name) user.name = name[0].toUpperCase() + name.slice(1);
    if (email) user.email = email;
    if (contactNumber) user.contactNumber = contactNumber;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({ code: 200, message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});
app.delete("/api/v1/user-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await SignupForm.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }

    res.status(200).json({ code: 200, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "debugiztech@gmail.com",
    pass: "aqsp gdae uszm kxcb",
  },
});

app.post("/api/v1/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ code: 400, message: "Email is required" });
  }
  try {
    const user = await SignupForm.findOne({ email });
    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await transporter.sendMail({
      from: "Debugiz",
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    });
    res.status(200).json({ code: 200, message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});

app.post("/api/v1/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ code: 400, message: "All fields are required" });
  }
  try {
    const user = await SignupForm.findOne({ email });

    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }
    if (user.resetOtp != otp || new Date() > user.otpExpiry) {
      return res
        .status(400)
        .json({ code: 400, message: "Invalid or expired OTP" });
    }
    user.password = newPassword;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.status(200).json({ code: 200, message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(process.env.PASSWORD);
  console.log(`Server is running on port: ${PORT}`);
});
