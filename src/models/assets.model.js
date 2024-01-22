import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const assetSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
        index:"text"
    },
    assetType:{
        type:String,
        enum:["image","video","audio","document"],
        required:true,
    },
    assetURL:{
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

assetSchema.plugin(mongooseAggregatePaginate);

export const Asset = mongoose.model("Asset",assetSchema);