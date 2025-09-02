import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_SECRET_KEY,
});

const uploadOnCloudnary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    const response = await await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    console.log("file is uploaded successful", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath); //this removes the file from teh local if the upload fails
    return null;
  }
};

export { uploadOnCloudnary };
