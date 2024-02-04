import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    toggleFollow,
    getFollowers,
    getFollowings
} from "../controllers/follower.controller.js"


const router = Router();
router.use(verifyJWT);

router.route("/toggle/:username").post(toggleFollow);
router.route("/get-followers/:username").get(getFollowers);
router.route("/get-followings/:username").get(getFollowings);


export default router;