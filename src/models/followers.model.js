import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followerSchema = new Schema({
    followedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    profile:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});

followerSchema.plugin(mongooseAggregatePaginate);

export const Follower = mongoose.model("Follower",followerSchema);