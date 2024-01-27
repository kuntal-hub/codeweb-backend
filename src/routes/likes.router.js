import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleAssetLike,
    toggleCollectiontLike,
    toggleCommentLike,
    toggleReplayLike,
    toggleWebLike
} from "../controllers/like.controller.js"

const router = Router();
router.use(verifyJWT);

router.route("/web/:webId").post(toggleWebLike);
router.route("/asset/:assetId").post(toggleAssetLike);
router.route("/collection/:collectionId").post(toggleCollectiontLike);
router.route("/comment/:commentId").post(toggleCommentLike);
router.route("/replay/:replayId").post(toggleReplayLike);

export default router;