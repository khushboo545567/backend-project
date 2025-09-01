import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
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
  this.password = bcrypt.hash(this.password, 10);
  next();
});

// LOGIN---------------------------
// CHEK THE USER SEND THE CORRECT PASSWORD OR NOT
userSchema.methods.ischeckPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT TOKEN GENERATE OF EVERY REQUEST FORM THE CLIENT-----------

export const User = mongoose.model("User", userSchema);
