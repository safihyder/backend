import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT=asyncHandler(async(req,res,next)=>{
   try {
     const token=req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ","")
     if(!token){
         throw new ApiError(401,"Unauthorized request")
     }
     const decodedToken=JWT.verify(token,process.env.ACCESS_TOKEN_SECERT)
     const user=User.findById(decodedToken?._id)
     .select("-password -refreshToken")
     if(!user){
         throw new ApiError(401,"Invalid Access Token")
     }
     req.user=user;
     next()
   } catch (error) {
    throw new ApiError(401,error?.message||"Invalid access token")
   }
})