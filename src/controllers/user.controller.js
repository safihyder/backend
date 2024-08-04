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
console.log(req.body)
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
res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out!"))
})
export {registerUser,loginUser,logoutUser}