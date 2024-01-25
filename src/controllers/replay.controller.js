import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponce } from '../utils/ApiResponce.js';
import mongoose from 'mongoose';
import {Replay} from "../models/replays.model.js";

const createReplay = asyncHandler(async (req, res) => {
    // get text and commentId from body
    const {text,commentId} = req.body;
    // check if text and commentId both are present or not
    if (!text || !commentId) {
        throw new ApiError(400, 'Text and commentId both are required');
    }
    // create replay
    const replay = await Replay.create({
        text:text,
        comment:new mongoose.Types.ObjectId(commentId),
        owner:new mongoose.Types.ObjectId(req.user?._id)
    });
    // check if replay is created or not
    if (!replay) {
        throw new ApiError(500, 'Something went wrong while creating replay');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,replay, 'Replay created successfully'));
});


const updateReplay = asyncHandler(async (req, res) => {
    // get text and replayId from body
    const {text,replayId} = req.body;
    // check if text and replayId both are present or not
    if (!replayId || !text) {
        throw new ApiError(400, 'Replay id and text both are required');
    }
    // update replay
    const replay = await Replay.findByIdAndUpdate(replayId,{
        text:text
    },{
        new:true
    });
    // check if replay is updated or not
    if (!replay) {
        throw new ApiError(500, 'Something went wrong while updating replay');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,replay, 'Replay updated successfully'));
});


const deleteReplay = asyncHandler(async (req, res) => {
    // get replayId from params
    const {replayId} = req.params;
    // check if replayId is present or not
    if (!replayId) {
        throw new ApiError(400, 'Replay id is required');
    }
    // delete replay
    const replay = await Replay.findByIdAndDelete(replayId);
    // check if replay is deleted or not
    if (!replay) {
        throw new ApiError(500, 'Something went wrong while deleting replay');
    }
    // return response
    return res
        .status(200)
        .json(new ApiResponce(200,{}, 'Replay deleted successfully'));
});


export {
    createReplay,
    updateReplay,
    deleteReplay
}