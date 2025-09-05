import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token",
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // take data form the user
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or password is reqired");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // THIS IS PRESENT IN THE TAKEN USER ONLY THIS METHOD
  const isPassWordValid = await user.ischeckPassword(password);
  if (!isPassWordValid) {
    throw new ApiError(401, "Invalid user creadintials");
  }
  // NOW GENERATE THE TOKENS
  const { accessToken, RefreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // NOW WE HAVE TO DECIDE WHICH DATA TO SEND TO THE USER //either you can query form the database or just modify the current object
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  ); //we are not sending the password and refreshtoken

  // AFTER DESIDING THE WHICH DATA TO SEND AND THEN SEND THE COOKIE FOR THAT SET SECURITY SO THAT NO ONE CAN CHANGE THE REFRESH TOKEN FORM THE FRONTEND
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, RefreshToken },
        "user logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    //BY ADDING NEW , IT RETURNS NEW UPDATED VALUE OTHERWISE IT WILL RETURN OLD VALUE
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User looged out"));
});

// when the access token is expires then frontend hit the route where to refresh the access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefrershToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefrershToken) {
    throw new ApiError(401, "Unauthorized access");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefrershToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    // NOW MATCH INCOMMING REFRESH TOKEN IS NOW COMPARED THE ORG REFRESH TOKEN
    if (incomingRefrershToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // now if the refresh token are matched then we generate the new access token and refresh token as well

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token is refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordcorrect = await user.ischeckPassword(oldpassword);
  if (!isPasswordcorrect) {
    throw new ApiError(400, "invalid password");
  }
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// GET THE USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "current user fetched sussfully");
});

// UPDATE ANY FIELDS
const updateAccount = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  // if there is a file then put that seperataly
  if (!fullname || !email) {
    throw new ApiError(400, "all fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname: fullname, email: email },
    },
    { new: true },
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

// SEPERATLY HANDLE THE FILES
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  const avatar = await uploadOnCloudnary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading the avatar on cloudinary");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

// UPDATE THE COVER IMAGE
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  const coverImage = await uploadOnCloudnary(avatarLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading the avatar on cloudinary");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccount,
  updateUserAvatar,
  updateUserCoverImage,
};
