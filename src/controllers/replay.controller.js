import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Replay} from "../models/replays.model.js";

const createReplay = asyncHandler(async (req, res) => {
    const {text,commentId} = req.body;

    if (!text || !commentId) {
        throw new ApiError(400, 'Text and commentId both are required');
    }

    const replay = await Replay.create({
        text:text,
        comment:new mongoose.Types.ObjectId(commentId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });

    if (!replay) {
        throw new ApiError(500, 'Something went wrong while creating replay');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,replay, 'Replay created successfully'));
});


const updateReplay = asyncHandler(async (req, res) => {
    const {text,replayId} = req.body;

    if (!replayId || !text) {
        throw new ApiError(400, 'Replay id and text both are required');
    }

    const replay = await Replay.findByIdAndUpdate(replayId,{
        text:text
    },{
        new:true
    });

    if (!replay) {
        throw new ApiError(500, 'Something went wrong while updating replay');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,replay, 'Replay updated successfully'));
});


const deleteReplay = asyncHandler(async (req, res) => {
    const {replayId} = req.params;

    if (!replayId) {
        throw new ApiError(400, 'Replay id is required');
    }

    const replay = await Replay.findByIdAndDelete(replayId);

    if (!replay) {
        throw new ApiError(500, 'Something went wrong while deleting replay');
    }

    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Replay deleted successfully'));
});


export {
    createReplay,
    updateReplay,
    deleteReplay
}