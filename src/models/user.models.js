import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });

// BYCRIPT HELPS US TO ENCRYPT THE PASSWORD

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vedio",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);
// this is the middle ware by which we are storing the hashed data in to the pasword and generate the token as well
// THIS PRE FUNCTION WILL RUN AFTER EVERY CHANGE IN THE DB SO TO STOP THAT USE ISMODIFIED FUNCTIon
// SIGNUP -------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// LOGIN---------------------------
// CHEK THE USER SEND THE CORRECT PASSWORD OR NOT
userSchema.methods.ischeckPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT TOKEN GENERATE OF EVERY REQUEST FORM THE CLIENT-----------
userSchema.methods.generateAccessToken = function () {
  // it is too fast thats why we dont add async we use async then also there is no problem

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  // IT REFRESHES AGAIN AND AGAIN SO IT CONTAIN FEW INFO
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};
export const User = mongoose.model("User", userSchema);
