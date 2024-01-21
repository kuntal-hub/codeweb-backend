import {asyncHandler} from '../utils/asyncHandler.js';
import {Collection} from "../models/collecntions.model.js"
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import { Web } from '../models/webs.model.js';
import mongoose from 'mongoose';

const createCollection = asyncHandler(async(req,res)=>{
    const {name,description,isPublic=true} = req.body;

    if (!name) {
        throw new ApiError(400,"Name is required");
    }

    const collectionExists = await Collection.findOne({name,owner:req.user?._id});

    if (collectionExists) throw new ApiError(400,"Collection with this name already exists");

    const collection = await Collection.create({
        name:name,
        description:description || "",
        isPublic,
        owner:req.user?._id
    });

    if (!collection) {
        throw new ApiError(500,"Something went wrong while creating collection");
    }

    return res
    .status(201)
    .json(new ApiResponce(201,collection,"Collection created successfully"))
})

const updateCollection = asyncHandler(async(req,res)=>{
    const {name,description} = req.body;
    const {collectionId} = req.params;

    if (!name || !collectionId) {
        throw new ApiError(400,"collectionId and name is required");
    }

    const collection = await Collection.findOneAndUpdate({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    },
    {
        name,
        description:description || ""
    },{new:true});

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection updated successfully"))
})

const deleteCollection = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;

    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }
    
    const collection = await Collection.findOneAndDelete({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to delete this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,{},"Collection deleted successfully"))
})

const addWebToCollection = asyncHandler(async(req,res)=>{
    const {collectionId,webId} = req.params;
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }

    const exiestingCollection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!exiestingCollection) throw new ApiError(404,"Collection not found or you are not authorized to update this collection");

    const collection = await Collection.findByIdAndUpdate(
        collectionId,
        {
            $addToSet:{
                webs:new mongoose.Types.ObjectId(webId)
            }
        },
        {new:true}
    )

    if (!collection) {
        throw new ApiError(500,"something went wrong while adding web to collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web added to collection successfully"))
})

const removeWebFromCollection = asyncHandler(async(req,res)=>{
    const {collectionId,webId} = req.params;
    if (!collectionId || !webId) {
        throw new ApiError(400,"collectionId and webId is required");
    }

    const collection = await Collection.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(collectionId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $pull:{
                webs:new mongoose.Types.ObjectId(webId)
            }
        },
        {new:true}
    );

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Web removed from collection successfully"))
})

const toggleCollectionPublishStatus = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findOne({
        _id:new mongoose.Types.ObjectId(collectionId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!collection) {
        throw new ApiError(404,"Collection not found or you are not authorized to update this collection");
    }

    collection.isPublic = !collection.isPublic;

    const savedCollection = await collection.save({validateBeforeSave:false});

    if (!savedCollection) {
        throw new ApiError(500,"something went wrong while updating collection publish status");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,savedCollection,"Collection publish status updated successfully"))
});

const updateViewCount = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(collectionId),
        },
        {
            $inc:{
                views:1
            }
        },
        {new:true}
    ).select("views");

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection view count updated successfully"))
})

const getCollectionByCollectionId = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    const {userId} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(collectionId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"followers",
                            localField:"_id",
                            foreignField:"profile",
                            as:"followers"
                        }
                    },
                    {
                        $addFields:{
                            followersCount:{$size:"$followers"},
                            isFollowedByMe:{
                                $cond:{
                                    if:{
                                        $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$followers.followedBy"]
                                    },
                                    then:true,
                                    else:false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1,
                            followersCount:1,
                            isFollowedByMe:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"collection",
                as:"likes"
            }
        },
        {
            $addFields:{
                websCount:{$size:"$webs"},
                likesCount:{$size:"$likes"},
                owner:{$first:"$owner"},
                isLiked:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                likes:0
            }
        } 
    ])

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,collection,"Collection fetched successfully"))
})


const getCollectionWEbsByCollectionId = asyncHandler(async(req,res)=>{
    const {collectionId} = req.params;
    const {userId,page=1,limit=4} = req.query;
    if (!collectionId) {
        throw new ApiError(400,"collectionId is required");
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
        throw new ApiError(404,"Collection not found");
    }

    const webs = await Web.aggregatePaginate([
        {
            $match:{
                _id:{$in:collection.webs}
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"web",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"web",
                as:"comments"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                commentsCount:{$size:"$comments"},
                owner:{$first:"$owner"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[userId? new mongoose.Types.ObjectId(userId) : " ","$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                likes:0,
                comments:0
            }
        }
    ],{page:page,limit:limit});

    if (!webs) {
        throw new ApiError(404,"Webs not found");
    }

    return res
    .status(200)
    .json(new ApiResponce(200,webs,"Webs fetched successfully"))

})



export {
    createCollection,
    updateCollection,
    deleteCollection,
    addWebToCollection,
    removeWebFromCollection,
    toggleCollectionPublishStatus,
    updateViewCount,
    getCollectionByCollectionId,
    getCollectionWEbsByCollectionId,
    
}