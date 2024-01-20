import mongoose,{Schema} from "mongoose";

const collectionSchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        trim:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    isPublic:{
        type:Boolean,
        default:true
    },
    webs:[{
        type:Schema.Types.ObjectId,
        ref:"Web"
    }]
},{timestamps:true});

export const Collection = mongoose.model("Collection",collectionSchema);