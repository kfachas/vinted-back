const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");
const uid2 = require("uid2");

const Offer = require("../models/Offer");
const Account = require("../models/User");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const actualUser = await Account.findById(req.user);
    if (
      req.fields.title.length > 50 ||
      req.fields.description.length > 500 ||
      req.fields.price.length > 100000
    ) {
      return res.status(400).json({ error: "Trop de caractères" });
    }
    // DESTRUCTURING
    // const {title, description, price, condition, city, brand, size, color} = req.fields

    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: actualUser,
    });
    if (req.files.picture.size !== 0) {
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        folder: `vinted/offers/${newOffer.id}`,
      });
      newOffer.product_image = result.secure_url;
      await newOffer.save();
      return res.status(200).json({
        _id: newOffer.id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        owner: {
          account: actualUser.account,
          id: actualUser.id,
        },
        product_image: newOffer.product_image,
      });
    } else {
      await newOffer.save();
      return res.status(200).json({
        _id: newOffer.id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        owner: {
          account: actualUser.account,
          id: actualUser.id,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const updateOffer = await Offer.findById(req.fields.id);
    if (Object.keys(req.fields).length > 1) {
      if (req.fields.title) {
        updateOffer.product_name = req.fields.title;
      }
      if (req.fields.description) {
        updateOffer.product_description = req.fields.description;
      }
      if (req.fields.price) {
        updateOffer.product_price = req.fields.price;
      }
      if (req.fields.condition) {
        updateOffer.product_details["ETAT"] =
          req.fields.product_details.condition;
      }
    } else {
      return res.status(400).json({ message: "Aucune modification effectué " });
    }

    await updateOffer.save();

    res.status(200).json(updateOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.fields.id);
    if (!offer) {
      return res.status(400).json({ message: "Offer not found" });
    } else {
      cloudinary.uploader.destroy(`${req.fields.id}`, function (result) {
        console.log(result);
      });
      return res.status(200).json({ error: "Offer successfuly deleted" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    if (req.query) {
      const newObj = {};
      const sortObj = {};
      if (req.query.title) {
        newObj.product_name = new RegExp(req.query.title, "i");
      }
      if (req.query.priceMin) {
        newObj.product_price = { $gte: Number(req.query.priceMin) };
      }
      if (req.query.priceMax) {
        if (newObj.product_price) {
          newObj.product_price.$lte = Number(req.query.priceMax);
        } else {
          newObj.product_price = { $lte: Number(req.query.priceMax) };
        }
      }
      try {
        if (req.query.sort === "price-asc" || req.query.sort === "price-desc") {
          sortObj.sort = {
            product_price: req.query.sort.replace("price-", ""),
          };
        }
      } catch (error) {}

      let page;
      const limit = Number(req.query.limit);
      if (Number(req.query.page < 1)) {
        page = 1;
      } else {
        const page = Number(req.query.page);
      }

      const offer = await Offer.find(newObj)
        .sort(sortObj.sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .select("product_name product_price");
      const count = await Offer.countDocuments(newObj);
      return res.json({ count: count, offers: offer });
    } else {
      res.status(400).json({ message: error.message });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const newOffer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    return res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
