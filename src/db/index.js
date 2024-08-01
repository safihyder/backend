import mongoose from "mongoose"
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
    try {
        console.log(process.env.MONGO_URI)
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n MongoDB conencted!! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB Connection Failed:", error)
        process.exit(1)
    }
}
export default connectDB;