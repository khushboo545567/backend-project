import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation - check the data is correct or not
  // check if the user is already exist or not
  // check for images, avatar
  // upload them to cloudnary and get the url to store that in to the database, check if the avtar gets updated on cloudnary or not
  // create the user object // create entry in db
  // remove the password and token from the response
  //check for user creation if not created returen error
  // if yes then retrun res;

  // TAKEN THE DATA PART
  const { fullname, username, password, email } = req.body;

  // VALIDATE THE DATA
  // if (fullname == "") {
  //   throw new ApiError(400,"fullname is required");
  // }  // THIS IS DONE BY BIGNNER WE HAVE TO CHECK FOR ALL THE FIELDS SO

  // ANOTHER WAY SORT METHOD
  if (
    [fullname, username, password, email].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "full name is required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "user is already exist with this email, username");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // IT WILL GIVE THE ERROR BECAUSE OF OPTIONAL CHAINING
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // SO TO THIS WE HAVE TO DO WITH IF ELSE

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadOnCloudnary(avatarLocalPath);
  const coverImage = await uploadOnCloudnary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    fullname,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while resgestring the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

export { registerUser };
