import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createWeb,
    createForkedWeb,
    getWebByWebId,
    getFollowingWebs,
    getTrendingWebs,
    getAllWebsByUserId,
    getLikedWebs,
    getYourWorkWebs,
    RecomendedpeopleToFollow,
    updateWeb,
    deleteWeb,
    togglePublishStatus,
    updateWebViewCount
} from "../controllers/web.controller.js"
import {upload} from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/create").post(verifyJWT,upload.single("image"),createWeb);
router.route("/create-forked/:webId").post(verifyJWT,createForkedWeb);
router.route("/get/:webId").get(getWebByWebId);
router.route("/following").get(verifyJWT,getFollowingWebs);
router.route("/trending").get(getTrendingWebs);
router.route("/user/:userId").get(getAllWebsByUserId);
router.route("/liked").get(verifyJWT,getLikedWebs);
router.route("/your-work").get(verifyJWT,getYourWorkWebs);
router.route("/recomended-people").get(verifyJWT,RecomendedpeopleToFollow);
router.route("/update/:webId").patch(verifyJWT,upload.single("image"),updateWeb);
router.route("/delete/:webId").delete(verifyJWT,deleteWeb);
router.route("/toggle-publish-status/:webId").patch(verifyJWT,togglePublishStatus);
router.route("/inc-view/:webId").patch(updateWebViewCount);


export default router;