import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const webSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true,
        index:"text"
    },
    description:{
        type:String,
        trim:true
    },
    html:{
        type:String,
    },
    css:{
        type:String,
    },
    js:{
        type:String,
    },
    image:{
        type:String,
        required:true,
    },
    public_id:{
        type:String,
        required:true,
    },
    views:{
        type:Number,
        default:0
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    isPublic:{
        type:Boolean,
        default:true
    },
    forkedFrom:{
        type:Schema.Types.ObjectId,
        ref:"Web"
    },
    cssLinks:[{
        type:String
    }],
    jsLinks:[{
        type:String
    }],
},{timestamps:true})

webSchema.plugin(mongooseAggregatePaginate);

export const Web = mongoose.model("Web",webSchema);