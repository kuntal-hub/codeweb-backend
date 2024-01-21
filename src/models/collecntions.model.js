import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const collectionSchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        index:"text"
    },
    description:{
        type:String,
        trim:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    views:{
        type:Number,
        default:0
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

collectionSchema.plugin(mongooseAggregatePaginate);

export const Collection = mongoose.model("Collection",collectionSchema);