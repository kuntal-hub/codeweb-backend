import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const replaySchema = new Schema({
    text:{
        type:String,
        required:true,
        trim:true
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
},{timestamps:true});

replaySchema.plugin(mongooseAggregatePaginate);

export const Replay = mongoose.model("Replay",replaySchema);