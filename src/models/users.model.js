import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        index:true,
        minLength:4,
        loawercase:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        index:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    password:{
        type:String,
        minLength:8,
        required:[true,"Password is required"],
        trim:true
    },
    avatar:{
        type:String,
        default:"https://res.cloudinary.com/dvrpvl53d/image/upload/v1705401447/vbhdn2mo3facgwbanema.jpg"
    },
    avatarPublicId:{
        type:String,
        default:"vbhdn2mo3facgwbanema"
    },
    coverImage:{
        type:String,
        default:"https://res.cloudinary.com/dvrpvl53d/image/upload/v1705401598/l1bthaxmnngyxabxmhwi.jpg"
    },
    coverImagePublicId:{
        type:String,
        default:"l1bthaxmnngyxabxmhwi"
    },
    pined:[
        {
            type:Schema.Types.ObjectId,
            ref:"Web"
        }
    ],
    showcase:[
        {
            type:Schema.Types.ObjectId,
            ref:"Web"
        }
    ],
    refreshToken:{
        type:String
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    bio:{
        type:String,
        trim:true
    },
    link1:{
        type:String,
        trim:true
    },
    link2:{
        type:String,
        trim:true
    },
    link3:{
        type:String,
        trim:true
    },
},{timestamps:true})

userSchema.pre("save",async function(next){
    if (!this.isModified("password")) {
        return next(); 
    }

    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordMatch = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User",userSchema);