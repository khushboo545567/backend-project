import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const connectionDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(`mongo db is connected ${connectionInstance.connection.host}`);
    console.log("database connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectionDB;
