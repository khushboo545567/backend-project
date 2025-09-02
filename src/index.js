import dotenv from "dotenv";
dotenv.config({ path: "./env" });
import connectionDB from "./db/dbConnection.js";
import { app } from "./app.js";

connectionDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`✅ Server is running on port : ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("❌ MongoDB connection failed:", error);
  });
