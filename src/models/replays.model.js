import mongoose,{Schema} from "mongoose";

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

export const Replay = mongoose.model("Replay",replaySchema);