import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken=async(userId)=>{
    const user=await User.findOne(userId);
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false})
    return {refreshToken,accessToken}
}
const registerUser=asyncHandler(async (req,res)=>{
  //Get user details from the frontend
  //validation_ not empty
  //check if already exists
//check fro images ,check for avatar, avatar
//upload on cloudinary
//create user object - create entry in db
//remove password and check refresh token field from response
//check for user creation
//return res
const {fullname,email,username,password}=req.body;
// console.log(email)
if([fullname,email,username,password].some((field)=> field?.trim()==="")){
    throw new ApiError("400","All fields are required!")
}
const existedUser=await User.findOne({
    $or:[{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}
const avatarLocalPath=req.files?.avatar[0]?.path;
let coverImageLocalPath;
// const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length>0)){
    coverImageLocalPath=req.files.coverImage[0].path;
}
if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}
const avatar=await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);
if(!avatar){
    throw new ApiError(400,"Avatar file is required")
}
const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username
})
const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
}
return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)
})


const loginUser=asyncHandler(async(req,res)=>{
//data from req.body
//username or email
//find the user
//password check
//password and refresh token
//send cookies
const {username,email,password}=req.body;
// console.log(req.body)
if(!(username || email)){
    throw new ApiError(400,"Username or email is required")
}
const user=await User.findOne({
    $or:[{username},{email}]
})
if(!user){
    throw new ApiError(404,"user doesn't exist!")
}
const passwordValid=await user.isPasswordCorrect(password);
if(!passwordValid){
    throw new ApiError(401,"Invalid user credentials!")
}
const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
const loggedInUser=await User.findById(user._id).
select("-password -refreshToken")
const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(200,{
        user:loggedInUser,accessToken,refreshToken
    },
"User logged In Successfully!"
))
})
const logoutUser=asyncHandler(async(req,res)=>{
await User.findByIdAndUpdate(
    req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
        new:true
    }
)
const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out!"))
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access!")
    }
  try {
      const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECERT)
      const user=await User.findById(decodedToken?._id);
      if(!user){
          throw new ApiError(401,"Invalid Refresh Token!")
      }
      if(incomingRefreshToken!==user?.refreshToken){
          throw new ApiError(401,"Refersh token is expired or used")
      }
      const options={
          httpOnly:true,
          secure:true
      }
      const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
      res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
          new ApiResponse(
              200,
              {accessToken,refreshToken},
              "Access Token Refreshed"
          )
      )
  } catch (error) {
    throw new ApiError(401,"Invalid refesh token")
  }
})

  const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {currentPassword,newPassword}=req.body;
    if(!currentPassword || !newPassword){
        throw new ApiError(400,"Current password and new password are required")
    }
    const user=await User.findById(req.user._id);
    const passwordValid=await user.isPasswordCorrect(currentPassword);
    if(!passwordValid){
        throw new ApiError(401,"Invalid current password")
    }
    user.password=newPassword;
    await user.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed successfully")
    )
})
const getCurrentUser=asyncHandler(async(req,res)=>{
return res
.status(200)
.json(200,req.user,"User details fetched successfully")
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
const {fullname,email}=req.body;
if(!fullname || !email){
    throw new ApiError(400,"Fullname and email are required")
}
const user=await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{  fullname,
        email:email}
    },
    {
        new:true
    }
).select("-password")
res.status(200).json(new ApiResponse(200,user,"User details updated successfully"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400,"Avatar file is required")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
           $set:{ avatar:avatar.url}
        },
        {
            new:true
        }
    ).select("-password")
    res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is required")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400,"Cover Image file is required")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
           $set:{ coverImage:coverImage.url}
        },
        {
            new:true
        }
    ).select("-password")
    res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully"))
})
export {registerUser,loginUser,logoutUser
    ,refreshAccessToken
    ,changeCurrentPassword,getCurrentUser,updateAccountDetails}