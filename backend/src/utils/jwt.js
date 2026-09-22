const jwt = require("jsonwebtoken");

const generateToken = (user) => {

 return jwt.sign(
  {
   userId:user.id,
   tenantId:user.tenantId,
   role:user.role
  },
  process.env.JWT_SECRET,
  {
   expiresIn:"1d"
  }
 );
};

module.exports = generateToken;