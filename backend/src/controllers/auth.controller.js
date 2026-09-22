const bcrypt = require("bcrypt");

const prisma = require("../config/prisma");

exports.register = async (req,res)=>{

 const {name,email,password,tenantId,role}=req.body;

 const hash = await bcrypt.hash(password,10);

 const user = await prisma.user.create({
  data:{
   name,
   email,
   passwordHash:hash,
   tenantId,
   role
  }
 });

 res.status(201).json(user);
};

const generateToken = require("../utils/jwt");

exports.login = async (req,res)=>{

 const {email,password}=req.body;

 const user = await prisma.user.findUnique({
  where:{email}
 });

 if(!user){
  return res.status(401).json({
   message:"Invalid credentials"
  });
 }

 const valid = await bcrypt.compare(
  password,
  user.passwordHash
 );

 if(!valid){
  return res.status(401).json({
   message:"Invalid credentials"
  });
 }

 const token = generateToken(user);

 res.json({
  token
 });
};