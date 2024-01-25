import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Asset} from "../models/assets.model.js";
import { Like } from '../models/likes.model.js';

const createAsset = asyncHandler(async(req,res)=>{
    const {title,assetType,assetURL,assetPublicId,isPublic=true} = req.body;

    if (!title || !assetType || !assetURL || !assetPublicId) {
        throw new ApiError(400,"Please provide all the required fields");
    }

    const asset = await Asset.create({
        title,
        assetType,
        assetURL,
        assetPublicId,
        isPublic,
        owner:req.user?._id
    });

    if (!asset) {
        throw new ApiError(500,"Something went wrong while creating the asset");
    }

    return res
        .status(201)
        .json(new ApiResponce(201,asset,"Asset created successfully"));

})

const getAllAssetsCreatedByUser = asyncHandler(async(req,res)=>{
    const  {page=1,limit=20,assetType="image"} = req.query;

    const assets = Asset.aggregatePaginate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id),
                assetType:assetType
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"asset",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
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
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!assets) {
        throw new ApiError(500,"Something went wrong while fetching the assets");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,assets,"Assets fetched successfully"));
})

const getAllPublicAssets = asyncHandler(async(req,res)=>{
    const {page=1,limit=20,assetType="image"} = req.query;

    const assets = Asset.aggregatePaginate([
        {
            $match:{
                isPublic:true,
                assetType:assetType
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"asset",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
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
        },
        {
            $sort:{
                likesCount:-1
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!assets) {
        throw new ApiError(500,"Something went wrong while fetching the assets");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,assets,"Assets fetched successfully"));
})

const searchFromPublicAssets = asyncHandler(async(req,res)=>{
    const {page=1,limit=20,assetType="image",search=""} = req.query;

    const assets = Asset.aggregatePaginate([
        {
            $match:{
                $and:[
                    {
                        isPublic:true
                    },
                    {
                        $text:{
                            $search:search
                        }
                    },
                    {
                        assetType:assetType
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"asset",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                },
                score:{$meta:"textScore"}
            }
        },
        {
            $project:{
                likes:0
            }
        },
        {
            $sort:{
                score:-1,
                likesCount:-1
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!assets) {
        throw new ApiError(500,"Something went wrong while fetching the assets");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,assets,"Assets fetched successfully"));
})


const getAssetById = asyncHandler(async(req,res)=>{
    const {assetId} = req.params;

    if (!assetId) {
        throw new ApiError(400,"Please provide assetId");
    }

    const asset = await Asset.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(assetId)
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
                        $lookup:{
                            from:"webs",
                            localField:"_id",
                            foreignField:"owner",
                            as:"webs"
                        }
                    },
                    {
                        $addFields:{
                            followersCount:{$size:"$followers"},
                            isFollowedByMe:{
                                $cond:{
                                    if:{
                                        $in:[new mongoose.Types.ObjectId(req.user?._id),"$followers.followedBy"]
                                    },
                                    then:true,
                                    else:false
                                }
                            },
                            websCount:{$size:"$webs"}
                        }
                    },
                    {
                        $project:{
                            followersCount:1,
                            isFollowedByMe:1,
                            websCount:1,
                            username:1,
                            fullName:1,
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
                foreignField:"asset",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                owner:{$first:"$owner"},
                isLikedByMe:{
                    $cond:{
                        if:{
                            $in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]
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

    if (!asset) {
        throw new ApiError(400,"asset not found invalid assetId");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,asset,"Asset fetched successfully"));
})

const deleteAssetById = asyncHandler(async(req,res)=>{
    const {assetId} = req.params;

    if (!assetId) {
        throw new ApiError(400,"Please provide assetId");
    }

    const deletedAsset = await Asset.findOneAndDelete({
        _id:new mongoose.Types.ObjectId(assetId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!deletedAsset) {
        throw new ApiError(400,"asset not found invalid assetId or you are not the owner of the asset");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{},"Asset deleted successfully"));
})


const updateAssetById = asyncHandler(async(req,res)=>{
    const {assetId} = req.params;
    const {title,isPublic=true} = req.body;

    if (!assetId) {
        throw new ApiError(400,"Please provide assetId");
    }

    const asset = await Asset.findOne({
        _id:new mongoose.Types.ObjectId(assetId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!asset) {
        throw new ApiError(400,"asset not found invalid assetId or you are not the owner of the asset");
    }

    asset.title = title? title : asset.title;
    asset.isPublic = isPublic;

    const savedAsset = await asset.save({validateBeforeSave:false});

    if (!savedAsset) {
        throw new ApiError(500,"Something went wrong while updating the asset");
    }

    return res
        .status(200)
        .json(new ApiResponce(200,savedAsset,"Asset updated successfully"));
})

const getLikedAssets = asyncHandler(async(req,res)=>{
    const {page=1,limit=20,assetType="image"} = req.query;

    const assets = Like.aggregatePaginate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user?._id),
                asset:{$exists:true}
            }
        },
        {
            $lookup:{
                from:"assets",
                localField:"asset",
                foreignField:"_id",
                as:"asset",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
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
                            foreignField:"asset",
                            as:"likes"
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"},
                            likesCount:{$size:"$likes"},
                            isLikedByMe:true
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
                asset:{$first:"$asset"}
            }
        },
        {
            $replaceRoot:{
                newRoot:"$asset"
            }
        },
        {
            $match:{
                assetType:assetType
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ],{
        page:parseInt(page),
        limit:parseInt(limit)
    });

    if (!assets) {
        throw new ApiError(500,"Something went wrong while fetching the assets");
        
    }
    
    return res
        .status(200)
        .json(new ApiResponce(200,assets,"Assets fetched successfully"));
})

export {
    createAsset,
    getAllAssetsCreatedByUser,
    getAllPublicAssets,
    searchFromPublicAssets,
    getAssetById,
    deleteAssetById,
    updateAssetById,
    getLikedAssets
}
