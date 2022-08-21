const express = require("express");
const WebUser = require("../../model/WebUser");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../../middleware/http-error");
const checkAuth = require("../../middleware/check-auth");

// Get all web users
router.get("/", async (req, res) => {
  const users = await WebUser.find();
  res.send(users);
});

router.post("/", async (req, res) => {
  try {
    const webUser = new WebUser({
      username: req.body.username,

      fullName: req.body.fullName,
      email: req.body.email,
      gender: req.body.gender,
      country: req.body.country,
      phone: req.body.phone,

      uni: req.body.uni,
      association: req.body.association,
      yearsOfStudy: req.body.yearsOfStudy,

      //bool
      delegate: req.body.delegate,

      gradYear: req.body.gradYear,

      //bool
      iadsEmployed: req.body.iadsEmployed,
      iadsMember: req.body.iadsMember,

      iadsPosition: req.body.iadsPosition,
      iadsEmail: req.body.iadsEmail,
    });

    await webUser.save();
    res.send(webUser);
  } catch (err) {
    console.log(err);
  }
});

router.post("/signup", async (req, res, next) => {
  console.log(req.body.data);
  let {
    username,
    fullName,
    email,
    gender,
    country,
    phone,
    password,
    uni,
    association,
    yearsOfStudy,
    delegate,
    gradYear,
    iadsEmployed,
    iadsMember,
    iadsPosition,
    iadsEmail,
  } = req.body.data;

  if (iadsEmail) iadsEmail = iadsEmail.toLowerCase();
  if (email) email = email.toLowerCase();

  let existingUsers = [];
  console.log("1");
  try {
    existingUsers.push(
      await WebUser.findOne({
        email: email,
      })
    );

    existingUsers.push(
      await WebUser.findOne({
        username: username,
      })
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  existingUsers = existingUsers.filter((item) => item !== null);
  console.log(username);
  console.log(existingUsers);
  if (existingUsers.length > 0) {
    // console.log(existingUsers)
    const error = new HttpError(
      "Email or username already exist already, please try again.",
      422
    );
    return next(error);
  }
  console.log("2");

  let createdUser;
  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  console.log("3");

  try {
    createdUser = new WebUser({
      username,
      fullName,
      email,
      gender,
      password: hashedPassword,
      country,
      phone,
      uni,
      association,
      yearsOfStudy,
      delegate,
      gradYear,
      iadsEmployed,
      iadsMember,
      iadsPosition,
      iadsEmail,
      validation: false,
    });
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again.", 500);
    return next(error);
  }

  console.log("4");

  let token;
  try {
    token = jwt.sign({ userId: createdUser.id }, "ia_65412654_ajbsc7qwe_ds", {
      expiresIn: "1d",
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Creating user failed, please try again.", 500);
    return next(error);
  }
  console.log("5");

  res.status(201).json({ user: createdUser, token: token });
});

router.post("/login", async (req, res, next) => {
  let { username, password } = req.body.data;
  username = username.toLowerCase();
  let existingUser;

  try {
    existingUser = await WebUser.findOne({
      username: username,
    });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  try {
    let isValidPassword = await bcrypt.compare(password, existingUser.password);

    if (!isValidPassword) {
      const error = new HttpError(
        "Invalid credentials, could not log you in.",
        401
      );
      return next(error);
    }

    if (!existingUser.validation) {
      const error = new HttpError(
        "Pending approval, could not log you in.",
        401
      );
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Could not log you in, please try again.", 500);
    console.log(err);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ userId: existingUser._id }, "ia_65412654_ajbsc7qwe_ds", {
      expiresIn: "1d",
    });
    console.log(token);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please try again.1",
      500
    );
    console.log(err);
    return next(error);
  }

  res.status(201).json({ user: existingUser, token: token });
});

module.exports = router;
