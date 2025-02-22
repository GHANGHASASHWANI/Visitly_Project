const User = require("../models/user");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// Render Forgot Password Form
module.exports.renderForgotPasswordForm = (req, res) => {
  res.render("users/forgot-password.ejs");
};

// Handle Forgot Password Request
module.exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "No account found with that email.");
    return res.redirect("/forgot-password");
  }

  // Generate Reset Token
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
  await user.save();

  // Send Email
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `http://${req.headers.host}/reset-password/${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Password Reset",
    text: `Click the link to reset your password: ${resetLink}`,
  });

  req.flash("success", "Password reset link sent to your email.");
  res.redirect("/login");
};

// Render Reset Password Form
module.exports.renderResetPasswordForm = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  if (!user) {
    req.flash("error", "Invalid or expired reset token.");
    return res.redirect("/forgot-password");
  }

  res.render("users/reset-password.ejs", { token });
};

// Handle Reset Password
module.exports.handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  if (!user) {
    req.flash("error", "Invalid or expired reset token.");
    return res.redirect("/forgot-password");
  }

  // Hash new password
  user.setPassword(password, async (err) => {
    if (err) {
      req.flash("error", "Error resetting password.");
      return res.redirect("/forgot-password");
    }

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    req.flash("success", "Password reset successful. You can now log in.");
    res.redirect("/login");
  });
};


// without forget password yha se start hota hai -- alert

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Visitly!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Visitly!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// with authentication of otp  


// const crypto = require("crypto"); // For generating OTP
// const nodemailer = require("nodemailer"); // For sending OTP emails

// module.exports.login = async (req, res) => {
//   try {
//     // Generate a random 6-digit OTP
//     const otp = crypto.randomInt(100000, 999999).toString();
//     const otpExpiry = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

//     // Save OTP and expiry in the user's document
//     req.user.otp = otp;
//     req.user.otpExpiry = otpExpiry;
//     await req.user.save();

//     // Send OTP to the user's email
//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: req.user.email,
//       subject: "Your OTP for Login",
//       text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
//     });

//     req.flash("success", "OTP sent to your email. Please check your inbox.");
//     res.redirect("/verify-otp"); // Redirect to OTP verification page
//   } catch (e) {
//     req.flash("error", "An error occurred while sending the OTP.");
//     res.redirect("/login");
//   }
// };

// // OTP verification logic
// module.exports.verifyOtp = async (req, res) => {
//   const { otp } = req.body;

//   // Find the user in session
//   const user = req.user;

//   if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
//     req.flash("error", "Invalid or expired OTP. Please try again.");
//     return res.redirect("/login");
//   }

//   // Clear OTP and expiry after successful verification
//   user.otp = null;
//   user.otpExpiry = null;
//   await user.save();

//   req.flash("success", "Login successful!");
//   let redirectUrl = res.locals.redirectUrl || "/listings";
//   res.redirect(redirectUrl);
// };

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you are logged out!");
    res.redirect("/listings");
  });
};
