import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    web:{
        type:Schema.Types.ObjectId,
        ref:"Web"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    asset:{
        type:Schema.Types.ObjectId,
        ref:"Asset"
    },
    replay:{
        type:Schema.Types.ObjectId,
        ref:"Replay"
    },
    collection:{
        type:Schema.Types.ObjectId,
        ref:"Collection"
    }
},{timestamps:true});

likeSchema.plugin(mongooseAggregatePaginate);
export const Like = mongoose.model("Like",likeSchema);