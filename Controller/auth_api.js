const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Student = require('../models/Student.schema')

const generateToken = (user) => {
  const payload = {
    _id: user._id,
    FullName: user.FullName,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

let RegisterUser = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.Password, salt);
    const newUser = new Student({
      FirstName: req.body.FirstName,
      LastName: req.body.LastName,
      Email: req.body.Email,
      Password: hashedPass,
      Age: req.body.Age
    });

    const user = await Student.create(newUser);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};

let LoginUser = async (req, res) => {
  try {
    const user = await Student.findOne({ Email: req.body.Email });

    if (!user) {
      // If user is not found, return an appropriate response
      return res.status(400).json("Wrong credentials!");
    }

    const validated = await bcrypt.compare(req.body.Password, user.Password);

    if (!validated) {
      // If password is incorrect, return an appropriate response
      return res.status(400).json("Wrong credentials!");
    }

    const token = generateToken(user);

    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, token });
  } catch (err) {
    // Handle other errors, e.g., database connection issues
    console.error(err);
    res.status(500).json("Internal server error happens");
  }
};

let VerifyUserCredentials = async (req, res) => {
  try {
    const user = await Student.findOne({ Email: req.body.Email });

    if (!user) {
      // If user is not found
      return res.status(400).json("User not found!");
    }


    const pin = crypto.randomInt(10000, 99999); // Generate a 6-digit PIN
    user.resetPin = pin;
    user.pinExpires = Date.now() + 300000;  // PIN valid for 1 hour
    await user.save();

    // Set up Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.Email,
      subject: "Password Reset PIN",
      text: `Your password reset PIN is ${pin}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error); // Log the specific error
        return res.status(401).json({ message: "Error sending email", error: error.message });
      }
      res.status(200).json({ message: "PIN sent to your email" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal server error");
  }
};

const VerifyPIN = async (req, res) => {
  const { email, pin } = req.body;

  try {
    const user = await Student.findOne({ Email:email, resetPin: pin, pinExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired PIN' });
    }

    res.status(200).json({ message: 'PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }

};


const UpdateUserPassword = async (req, res) => {
  try {
    const user = await Student.findOne({ Email: req.body.Email });

    if (!user) {
      // If user is not found
      return res.status(400).json("User not found!");
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.NewPassword, salt);

    // Update user's password in the database
    user.Password = hashedPassword;
    await user.save();

    res.status(200).json("Password updated successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal server error");
  }
};



module.exports = { RegisterUser, LoginUser, VerifyUserCredentials, VerifyPIN, UpdateUserPassword };