const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Student = require('../models/Student.schema')
const UserProgress = require('../models/UserProgress.schema')

const sendStreakBreakEmail = async (userId) => {
  // Fetch user details from the database
  const user = await Student.findById(userId);

  if (!user) {
    return;
  }

  // Set up Nodemailer to send the email
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,  // Your email address
      pass: process.env.EMAIL_PASSWORD,  // Your email password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,  // Sender address
    to: user.Email,  // Receiver's email address
    subject: "Your Learning Streak is Broken!",
    text: `Hello ${user.FirstName},\n\nIt seems like you've missed your learning streak! Don't worry, it's never too late to get back on track. Log in now and keep up the momentum to maintain your streak!\n\nKeep up the great work!\n- Structify Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Streak break email sent successfully!");
  } catch (error) {
    console.error("Error sending streak break email:", error);
  }
};

const updateStreak = async (userId) => {
  const userProgress = await UserProgress.findOne({ student: userId });
  const currentDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD

  let streakBroken = false; // New flag to track streak break

  if (!userProgress.streak.lastLoginDate) {
    // First login, initialize streak
    userProgress.streak.lastLoginDate = currentDate;
    userProgress.streak.currentStreak = 1;
    userProgress.streak.loginDates.push(new Date());
  } else {
    const lastLoginDate = new Date(userProgress.streak.lastLoginDate).toISOString().split("T")[0];

    if (new Date(lastLoginDate).getTime() + 86400000 === new Date(currentDate).getTime()) {
      // Consecutive login, increment streak
      userProgress.streak.currentStreak += 1;
    } else if (lastLoginDate !== currentDate) {
      // Non-consecutive login, reset streak
      userProgress.streak.currentStreak = 1;
      streakBroken = true; // Set streakBroken flag
    }

    if (!userProgress.streak.loginDates.some(date => date.toISOString().split("T")[0] === currentDate)) {
      userProgress.streak.loginDates.push(new Date()); // Avoid duplicate entries
    }
  }

  userProgress.streak.lastLoginDate = new Date();
  await userProgress.save();

  if (streakBroken) {
    // Send email to the user if streak is broken
    await sendStreakBreakEmail(userId);
  }
};


const generateToken = (user) => {
  const payload = {
    _id: user._id,
    FullName: user.FirstName + " " + user.LastName,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

let RegisterUser = async (req, res) => {
  try {

    const existingUser = await Student.findOne({ Email: req.body.Email });
    
    if (existingUser) {
      return res.status(400).json({ message: "You already have an account. Please Login" });
    }
    
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

    const token = generateToken(user);

    await updateStreak(user._id);
    
    res.status(200).json({
      token,  // JWT token
      user: {
        _id: user._id,       // Return user ID
        FullName: user.FirstName + " " + user.LastName  // Return full name
      }
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

let DuplicateUser = async (req, res) => {
  try {

    const existingUser = await Student.findOne({ Email: req.body.Email });
    
    if (existingUser) {
      return res.status(400).json({ message: "You already have an account. Please Login" });
    }
    
    
    res.status(200).json({ message: "Unique Email" });

  } catch (err) {
    res.status(500).json(err);
  }
};

let GoogleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    // Check if user already exists
    let user = await Student.findOne({ Email: email });


    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    const randomPassword = crypto.randomBytes(8).toString('hex'); 
    const salt = await bcrypt.genSalt(10); 
    const hashedPass = await bcrypt.hash(randomPassword, salt); 

    if (!user) {
      // Create a new user if they don't exist
      user = new Student({
        Email: email,
        FirstName: firstName,
        LastName: lastName,
        googleId,
        Password: hashedPass,
      });
      await user.save();
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = generateToken(user);

    await updateStreak(user._id);
    
    res.status(200).json({
      token,  // JWT token
      user: {
        _id: user._id,       // Return user ID
        FullName: user.FirstName + " " + user.LastName  // Return full name
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Authentication failed'});
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

    // Update streak
    await updateStreak(user._id);

    res.status(200).json({
      token,  // JWT token
      user: {
        _id: user._id,       // Return user ID
        FullName: user.FirstName + " " + user.LastName  // Return full name
      }
    });


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


let VerifyEmail = async (req, res) => {
  try {
    
    const pin = crypto.randomInt(10000, 99999); // Generate a 6-digit PIN
   
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
      subject: "Email Verification PIN",
      text: `Your email verification PIN is ${pin}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error); // Log the specific error
        return res.status(401).json({ message: "Error sending email", error: error.message });
      }
      res.status(200).json({ message: "PIN sent to your email", pin: pin });
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


const ProtectedRoute = async (req, res) =>{
  const { userId } = req.body; // Expecting userId from the request body
  const decodedUserId = res.locals.userId; // The ID from the decoded token

  // Check if the IDs match
  if (decodedUserId === userId) {
    return res.status(200).json({ message: 'Token is valid', userId: decodedUserId, userFullName: res.locals.userFullName });
  } else {
    return res.status(401).json('Access denied: Invalid user ID');
  }
};



//get user profile
let GetUserProfile = async (req,res) =>{
  const userId = res.locals.userId; // Assuming your middleware sets the user ID in req.user

  try {
    const userProfile = await Student.findById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}



let UpdateUserProfile = async (req, res) => {
  // User ID is available from the middleware
  let id = res.locals.userId;
  let data = req.body;

  try {
    let user = await Student.findByIdAndUpdate(id, data, { new: true });

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', err: err });
  }
};

//delete user
let Deleteuser =  async(req ,res)=>{
    let id = res.locals.userId;
    let users = await Freelance.findByIdAndDelete(id);
    if(users)
    {
       res.status(200).json(users)
    }else
    {
      res.status(404).json({"Message":"Error" , err:err})
    }
}



module.exports = { RegisterUser, LoginUser, VerifyUserCredentials, VerifyPIN, UpdateUserPassword , ProtectedRoute, UpdateUserProfile, Deleteuser, GetUserProfile, GoogleAuth, VerifyEmail, DuplicateUser};