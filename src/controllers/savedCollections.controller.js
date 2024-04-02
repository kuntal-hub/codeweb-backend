import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import { SavedCollection } from '../models/savedCollections.model.js';

const toggleSavedCollection = asyncHandler(async (req, res) => {
    // get collectionId from params
    const { collectionId } = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400, 'Collection id is required');
    }
    // check if collection is already saved by user or not
    const isSaved = await SavedCollection.findOne({
        collection: new mongoose.Types.ObjectId(collectionId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if collection is already saved by user then remove save
    if (isSaved) {
        // remove save
        const removeSave = await SavedCollection.findByIdAndDelete(isSaved._id);
        // check if save is removed or not
        if (!removeSave) {
            throw new ApiError(500, 'Something went wrong');
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponce(200, {}, 'Collection unsaved successfully'));
    }
    // if collection is not saved by user then save collection
    const save = await SavedCollection.create({
        collection: new mongoose.Types.ObjectId(collectionId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if save is created or not
    if (!save) {
        throw new ApiError(500, 'Something went wrong while saving collection');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200, {}, 'Collection saved successfully'));
});

const createSavedCollection = asyncHandler(async (req, res) => {
    // get collectionId from params
    const { collectionId } = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400, 'Collection id is required');
    }
    // check if collection is already saved by user or not
    const isSaved = await SavedCollection.findOne({
        collection: new mongoose.Types.ObjectId(collectionId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })
    // if collection is already saved by user then remove save
    if (isSaved) {
        return res
            .status(200)
            .json(new ApiResponce(200, {}, 'Collection saved successfully'));
    }
    // if collection is not saved by user then save collection
    const save = await SavedCollection.create({
        collection: new mongoose.Types.ObjectId(collectionId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if save is created or not
    if (!save) {
        throw new ApiError(500, 'Something went wrong while saving collection');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200, {}, 'Collection saved successfully'));
});


const deleteSavedCollection = asyncHandler(async (req, res) => {
    // get collectionId from params
    const { collectionId } = req.params;
    // check if collectionId is present or not
    if (!collectionId) {
        throw new ApiError(400, 'Collection id is required');
    }
    // delete saved collection
    const deleteSave = await SavedCollection.findOneAndDelete({
        collection: new mongoose.Types.ObjectId(collectionId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if save is deleted or not
    if (!deleteSave) {
        throw new ApiError(500, 'Something went wrong while deleting collection');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200, {}, 'Collection is not saved'));
});


const getSavedCollections = asyncHandler(async (req, res) => {
    // get saved collections of user

    const { page = 1, limit = 10 } = req.query;

    const aggregate = SavedCollection.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"collections",
                localField:"collection",
                foreignField:"_id",
                as:"collection",
                pipeline:[
                    {
                        $lookup:{
                            from:"webs",
                            localField:"webs",
                            foreignField:"_id",
                            as:"webs",
                            pipeline:[
                                {
                                    $sort:{
                                        views:-1
                                    }
                                },
                                {
                                    $project:{
                                        title:1,
                                        image:1,
                                        _id:1
                                    }
                                }
                            ]
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
                                        followersCount:{
                                            $size:"$followers"
                                        },
                                        isFollowedByMe:{
                                            $cond:{
                                                if:{
                                                    $in:[new mongoose.Types.ObjectId(req.user?._id),"$followers.followedBy"]
                                                },
                                                then:true,
                                                else:false
                                            }
                                        }
                                    }
                                },
                                {
                                    $project:{
                                        followersCount:1,
                                        isFollowedByMe:1,
                                        username:1,
                                        fullName:1,
                                        avatar:1,
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
                            webs:{$slice:["$webs",4]},
                            owner:{$first:"$owner"},
                            likesCount:{$size:"$likes"},
                            isSaved:true,
                            isLikedByMe:{
                                $cond:{
                                    if:{
                                        $in:[new mongoose.Types.ObjectId(req.user._id),"$likes.likedBy"]
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
                ]
            }
        },
        {
            $addFields:{
                collection:{$first:"$collection"}
            }
        },
        {
            $replaceRoot:{
                newRoot:"$collection"
            }
        },
    ]);

    const savedCollections = await SavedCollection.aggregatePaginate(aggregate,{
        page:parseInt(page),
        limit:parseInt(limit),
    })
    
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200, savedCollections, 'Saved collections fetched successfully'));
});

export { 
    createSavedCollection,
    deleteSavedCollection,
    toggleSavedCollection,
    getSavedCollections
 };