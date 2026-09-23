const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
};

exports.verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};