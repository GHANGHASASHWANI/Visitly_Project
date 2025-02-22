const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

// router.get("/logout", userController.logout);

// module.exports = router;


// with authentication of otp
// router
//   .route("/login")
//   .get(userController.renderLoginForm)
//   .post(
//     saveRedirectUrl,
//     passport.authenticate("local", {
//       failureRedirect: "/login",
//       failureFlash: true,
//     }),
//     // userController.login --> original
//     wrapAsync(userController.login) // Call the updated login controller
//   );

//   // verify otp 
//   router
//     .route("/verify-otp")
//     .get((req, res) => {
//       res.render("users/verify-otp.ejs"); // Render OTP verification page
//     })
//     .post(wrapAsync(userController.verifyOtp)); // Handle OTP verification

router.get("/logout", userController.logout);


// Forgot Password Routes
router.route("/forgot-password")
  .get(userController.renderForgotPasswordForm)
  .post(wrapAsync(userController.handleForgotPassword));

router.route("/reset-password/:token")
  .get(userController.renderResetPasswordForm)
  .post(wrapAsync(userController.handleResetPassword));

module.exports = router;