import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const savedCollectionSchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    collection:{
        type:Schema.Types.ObjectId,
        ref:"Collection",
        required:true
    }
},{timestamps:true});

savedCollectionSchema.plugin(mongooseAggregatePaginate);
export const SavedCollection = mongoose.model("SavedCollection",savedCollectionSchema);