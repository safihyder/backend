import mongoose,{Schema} from 'mongoose';
const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,// one who is a subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,// one to whom the subscriber is subscribing
        ref:"User"
    } 
})
export const Subscription=mongoose.model("subscription",subscriptionSchema)