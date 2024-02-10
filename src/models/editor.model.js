import mongoose,{Schema} from "mongoose";

const editorSchema = new Schema({
    theme:{
        type:String,
        default:"vs-dark",
        trim:true
    },
    indentation:{
        type:Number,
        default:1
    },
    fontSize:{
        type:String,
        default:"15px"
    },
    fontWeight:{
        type:String,
        enum:["700","400","500","600"],
        default:"500",
    },
    formatOnType:{
        type:Boolean,
        default:true
    },
    minimap:{
        type:Boolean,
        default:false
    },
    lineHeight:{
        type:Number,
        default:20
    },
    mouseWheelZoom:{
        type:Boolean,
        default:true
    },
    wordWrap:{
        type:String,
        enum:["on","off","wordWrapColumn","bounded"],
        default:"on"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{timestamps:true});

export const Editor = mongoose.model("Editor",editorSchema);