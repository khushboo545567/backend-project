import dotenv from "dotenv";
import connectionDB from "./db/dbConnection.js";
dotenv.config({ path: "./env" });
connectionDB();
