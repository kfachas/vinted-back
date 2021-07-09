const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const Account = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // Créer un nouveau compte et vérifier si il n'existe pas
    if (!req.fields.username) {
      return res
        .status(400)
        .json({ message: "Veuillez insérer un nom d'utilisateur" });
    }
    const testUser = await Account.findOne({ email: req.fields.email });
    if (testUser) {
      return res.status(400).json({ error: { message: "Mail already exist" } });
    }
    const newToken = uid2(64);
    const newSalt = uid2(16);
    const newHash = SHA256(req.fields.password + newSalt).toString(encBase64);
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: `vinted/profil/${req.fields.email}`,
    });

    const newUser = new Account({
      email: req.fields.email,
      token: newToken,
      account: {
        username: req.fields.username,
        phone: req.fields.phone,
        avatar: {
          secure_url: result.secure_url,
        },
      },
      hash: newHash,
      salt: newSalt,
    });

    await newUser.save();

    return res.status(200).json({
      _id: newUser.id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        phone: newUser.account.phone,
      },
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userConnect = await Account.findOne({ email: req.fields.email });
    const newHash = SHA256(req.fields.password + userConnect.salt).toString(
      encBase64
    );
    if (newHash === userConnect.hash) {
      return res.status(200).json({
        _id: userConnect.id,
        token: userConnect.token,
        account: userConnect.account,
      });
    } else {
      return res.status(401).json("Wrong password");
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
