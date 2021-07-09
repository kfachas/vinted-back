const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const cors = requiret("cors");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(formidableMiddleware());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const userRoutes = require("./routes/user");
const offersRoutes = require("./routes/offers");
app.use(userRoutes);
app.use(offersRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "Page not found ! 😔" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started ! 😎");
});
