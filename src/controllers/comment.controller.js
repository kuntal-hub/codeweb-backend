import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Comment} from "../models/comments.model.js";
import {Replay} from "../models/replays.model.js";

const createComment = asyncHandler(async (req, res) => {
    const {text,web} = req.body;

    if (!text || !web) {
        throw new ApiError(400, 'Text and web both are required');
    }

    const comment = await Comment.create({
        text:text,
        web:new mongoose.Types.ObjectId(web),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!comment) {
        throw new ApiError(500, 'Something went wrong while creating comment');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,comment, 'Comment created successfully'));
})


const updateComment = asyncHandler(async (req, res) => {
    const {text,commentId} = req.body;

    if (!commentId) {
        throw new ApiError(400, 'Comment id is required');
    }

    if (!text) {
        throw new ApiError(400, 'Text is required');
    }

    const comment = await Comment.findByIdAndUpdate(commentId,{
        text:text
    },{
        new:true
    });

    if (!comment) {
        throw new ApiError(500, 'Something went wrong while updating comment');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,comment, 'Comment updated successfully'));
});


const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!commentId) {
        throw new ApiError(400, 'Comment id is required');
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, 'Something went wrong while deleting comment');
    }

    await Replay.deleteMany({
        comment:new mongoose.Types.ObjectId(commentId)
    })

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Comment deleted successfully'));
});


const getAllWebComments = asyncHandler(async (req, res) => {
    const {webId,page=1,limit=20} = req.query;

    if (!webId || !mongoose.isValidObjectId(webId)) {
        throw new ApiError(400, 'Web id is required');
    }

    const comments = await Comment.aggregatePaginate([
        {
            $match:{
                web:new mongoose.Types.ObjectId(webId),
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
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"replays",
                localField:"_id",
                foreignField:"comment",
                as:"replays"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                replaysCount:{
                    $size:"$replays"
                },
                owner:{
                    $first:"$owner"
                },
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
                likes:0,
                replays:0
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ],{
        limit:parseInt(limit),
        page:parseInt(page)
    });

})

const getCommentById = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, 'Comment id is required');
    }

    const comment = await Comment.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(commentId)
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
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"replays",
                localField:"_id",
                foreignField:"comment",
                as:"replays",
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
                            foreignField:"replay",
                            as:"likes"
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            },
                            likesCount:{
                                $size:"$likes"
                            },
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
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                replaysCount:{
                    $size:"$replays"
                },
                owner:{
                    $first:"$owner"
                },
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
    ]);

    if (!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,comment, 'Comment fetched successfully'));
})

export {
    createComment,
    updateComment,
    deleteComment,
    getAllWebComments,
    getCommentById
}