import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Comment} from "../models/comments.model.js";
import {Replay} from "../models/replays.model.js";
import {Like} from "../models/likes.model.js";

const createComment = asyncHandler(async (req, res) => {
    // get text and web from body
    const {text,web} = req.body;
    // check if text and web both are present or not
    if (!text || !web) {
        throw new ApiError(400, 'Text and web both are required');
    }
    // create comment
    const comment = await Comment.create({
        text:text,
        web:new mongoose.Types.ObjectId(web),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if comment is created or not
    if (!comment) {
        throw new ApiError(500, 'Something went wrong while creating comment');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,comment, 'Comment created successfully'));
})


const updateComment = asyncHandler(async (req, res) => {
    // get text and commentId from body
    const {text} = req.body;
    const {commentId} = req.params;
    // check if text and commentId both are present or not
    if (!commentId) {
        throw new ApiError(400, 'Comment id is required');
    }

    if (!text) {
        throw new ApiError(400, 'Text is required');
    }
    // update comment
    const comment = await Comment.findByIdAndUpdate(commentId,{
        text:text
    },{
        new:true
    });
    // check if comment is updated or not
    if (!comment) {
        throw new ApiError(500, 'Something went wrong while updating comment');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,comment, 'Comment updated successfully'));
});


const deleteComment = asyncHandler(async (req, res) => {
    // get commentId from params
    const {commentId} = req.params;
    // check if commentId is present or not
    if (!commentId) {
        throw new ApiError(400, 'Comment id is required');
    }
    // delete comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    // check if comment is deleted or not
    if (!deletedComment) {
        throw new ApiError(500, 'Something went wrong while deleting comment');
    }
    // delete all likes of comment
    await Like.deleteMany({
        comment:new mongoose.Types.ObjectId(commentId)
    })
    // delete all replays of comment
    await Replay.deleteMany({
        comment:new mongoose.Types.ObjectId(commentId)
    })
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Comment deleted successfully'));
});


const getAllWebComments = asyncHandler(async (req, res) => {
    // get webId from query
    const {page=1,limit=20} = req.query;
    const {webId} = req.params;
    // check if webId is present or not
    if (!webId || !mongoose.isValidObjectId(webId)) {
        throw new ApiError(400, 'Web id is required');
    }
    // get comments
    const aggregate = Comment.aggregate([
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
    ]);

    const comments = await Comment.aggregatePaginate(aggregate,{
        limit:parseInt(limit),
        page:parseInt(page)
    });
    // check if comments are fetched or not
    if (!comments) {
        throw new ApiError(500, 'something went wrong while fetching comments');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,comments, 'Comments fetched successfully'));
})

const getCommentById = asyncHandler(async (req, res) => {
    // get commentId from params
    const {commentId} = req.params;
    // check if commentId is present or not
    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, 'Comment id is required');
    }
    // get comment
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
    // check if comment is fetched or not
    if (!comment || comment.length === 0) {
        throw new ApiError(404, 'Comment not found');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,comment[0], 'Comment fetched successfully'));
})

// export all controllers
export {
    createComment,
    updateComment,
    deleteComment,
    getAllWebComments,
    getCommentById
}