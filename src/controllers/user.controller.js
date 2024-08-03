import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {Users} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asyncHandler(async (req,res)=>{
  //Get user details from the frontend
  //validation_ not empty
  //check if already exists
//check fro images ,check for avatar, avatar
//upload on cloudinary
//create user object - create entry in db
//remove password ad check refresh token field from response
//check for user creation
//return res
const {fullname,email,username,password}=req.body;
console.log(email)
if([fullname,email,username,password].some((field)=> field?.trim()==="")){
    throw new ApiError("400","All fields are required!")
}
const existedUser=Users.findOne({
    $or:[{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}
const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}
const avatar=await uploadOnCloudinary(avatarLocalPath);
const coverImage=await uploadOnCloudinary(coverImageLocalPath);
if(!avatar){
    throw new ApiError(400,"Avatar file is required")
}
Users.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username
})
const createdUser=await Users.findOne.findById(user._id).select(
    "-passwod -refreshToken"
)
if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
}
return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)
})
export {registerUser,}