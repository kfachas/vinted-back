const express = require("express");
const router = express.Router();
// For authentification :
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Offer = require("../models/Offer");

// Road for inscription
router.post("/user/signup", async (req, res) => {
  try {
    // search if email already exist in DB
    const user = await User.findOne({ email: req.fields.email });

    // if she already exist then return error message
    if (user) {
      res.status(409).json({ message: "This email already has an account" });

      // Else if the user filled all required elements :
    } else {
      if (req.fields.email && req.fields.password && req.fields.username) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);

        // Create his account
        const newUser = new User({
          email: req.fields.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
        });

        if (req.files.picture.size > 0) {
          // Send picture at cloudinary if she exist
          const result = await cloudinary.uploader.unsigned_upload(
            req.files.picture.path,
            "vinted_upload",
            {
              folder: `api/vinted/profil/${newUser._id}`,
              public_id: "preview",
              cloud_name: "lereacteur",
            }
          );
          newUser.account.avatar = result.secure_url;
        }

        // Save his account in DB
        await newUser.save();

        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        // Else if the user forgot to filled some parametres required :
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Road for login
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
