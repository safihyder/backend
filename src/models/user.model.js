import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username: {
        type: String,
        requried: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        requried: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        requried: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, //cloudinary URL
        required:true,
    },
    coverImage: {
        type: String, //cloudinary URL
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String
    }

}, { timestamps: true })

userSchema.pre("save",async function(next) {
    if(!this.isModified("password"))return next();
    this.password=await bcrypt.hash(this.password,10)
    next()
})  
userSchema.methods.isPasswordCorrect=async function(password){
return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
    // console.log(process.env.ACCESS_TOKEN_SECERT,process.env.ACCESS_TOKEN_EXPIRY)
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECERT,
        {
            expiresIn:"1d",
        }

    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECERT,
        {
            expiresIn:"10d"
        }

    )
}
export const User = mongoose.model("user", userSchema)