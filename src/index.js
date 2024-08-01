import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
}) 

connectDB()
.then(process.env.PORT||8000,()=>{
    app.listen(consoel.log(`Server running on the port :${process.env.PORT}`));
    app.on("error",(error)=>{
        console.log("Error:",error)
        throw error
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed!!!",err)
})






 /*
 import express from "express"
 const app=express();
 (async()=>{
    try {
        await mongo.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error:",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App running on the port:${process.env.PORT}`)
        })
    } catch (error) {
        console.error('ERROR:',error)
        throw error;
    }
 })()
    */