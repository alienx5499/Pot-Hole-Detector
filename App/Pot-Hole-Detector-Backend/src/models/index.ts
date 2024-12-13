import mongoose from "mongoose";
import {MONGO_URL} from "../config/index"
mongoose.connect(`${MONGO_URL}`).then(()=>{console.log('connected to db');})
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const UserSchema = new Schema({
    name : {type : String,unique : true,required : true},
    email : {type : String,unique :true,required : true},
    passwordHash : {type : String,required : true},
    isGuest: { type: Boolean, default: false },
    profilePicture: { type: String },
    phone: { type: String },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
})
const ReportSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String }
    },
    detectionResultPercentage: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});
export const UserModel = mongoose.model("Users",UserSchema);
export const ReportModel = mongoose.model("Reports",ReportSchema);
export default {
    UserModel,
    ReportModel
}