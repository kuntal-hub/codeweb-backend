import mongoose,{Schema} from "mongoose";

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

export const Like = mongoose.model("Like",likeSchema);