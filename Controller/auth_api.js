const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
  
      const validated = await bcrypt.compare(req.body.OldPassword, user.Password);
  
      if (!validated) {
        // If old password is incorrect
        return res.status(400).json("Old password is incorrect!");
      }
  
      // If everything is correct
      res.status(200).json("User verified! You can proceed to reset your password.");
    } catch (err) {
      console.error(err);
      res.status(500).json("Internal server error");
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
  
  

module.exports = {RegisterUser,LoginUser, VerifyUserCredentials, UpdateUserPassword};