const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const verifyToken = async (req, res, next) => {
  //get the token from header
  const token = await req.header("Authorization");

  //Check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  //Verify token if exist
  try {
    const cutToken = token.slice(7);
    const decoded = jwt.verify(cutToken, JWT_SECRET);
    if (req.body._id == decoded._id);
    {
      next();
    }
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = {
  verifyToken,
};
