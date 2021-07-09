const Account = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const searchToken = req.headers.authorization.replace("Bearer ", "");
    // Rechercher dans la BDD si ce token existe
    const user = await Account.findOne({ token: searchToken });
    if (!user) {
      return res.status(401).json("Unauthorized");
    } else {
      req.user = user.id;
      next();
    }
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
