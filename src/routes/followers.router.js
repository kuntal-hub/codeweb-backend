import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    toggleFollow,
    getFollowers,
    getFollowings
} from "../controllers/follower.controller.js"


const router = Router();
router.use(verifyJWT);

router.route("/toggle/:profileId").post(toggleFollow);
router.route("/followers/:profileId").get(getFollowers);
router.route("/followings/:profileId").get(getFollowings);


export default router;