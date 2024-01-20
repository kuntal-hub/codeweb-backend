import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
    assetType:{
        type:String,
        enum:["image","video","audio","document"],
        required:true,
    },
    assetUrl:{
        type:String,
        required:true,
    },
    assetPublicId:{
        type:String,
        required:true,
    },
    isPublic:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
},{timestamps:true});

export const Asset = mongoose.model("Asset",assetSchema);