const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async (req, res) => {
  const checkUserName = await User.findOne({
    username: req.body.username,
  });

  const newUser = new User({
    userType: req.body.userType,
    username: req.body.username,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.SECRET_KEY
    ).toString(),
  });
  try {
    if (!checkUserName) {
      const user = await newUser.save();
      const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

      res.status(200).json({
        payload: { ...user._doc, password: originalPassword },
        message: "Register successfully!",
        status: "Success",
      });
    } else {
      return res.status(401).json({
        message: "Username is exists!",
        status: "Error",
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(401).json({
        message: "Username is wrong!",
        status: "Error",
      });
    }

    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

    if (originalPassword !== req.body.password) {
      return res.status(401).json({
        message: "Password is wrong!",
        status: "Error",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: "5d" }
    );

    const { password, ...info } = user._doc;

    res.status(200).json({
      payload: { ...info, accessToken },
      message: "Login successfully!",
      status: "Success",
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
