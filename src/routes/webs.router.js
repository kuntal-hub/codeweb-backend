import { Router } from "express";
import {verifyJWT, checkCurrentUser} from "../middlewares/auth.middleware.js";
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
    updateWebViewCount,
    searchFromWebsCreatedByMe,
    searchFromAllWebs,
    getEditorPreferences
} from "../controllers/web.controller.js"
import {upload} from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/create").post(verifyJWT,upload.single("image"),createWeb);
router.route("/create-forked/:webId").post(verifyJWT,createForkedWeb);
router.route("/get/:webId").get(checkCurrentUser,getWebByWebId);
router.route("/user/:username").get(checkCurrentUser,getAllWebsByUserId);
router.route("/liked/:username").get(checkCurrentUser,getLikedWebs);
router.route("/following").get(verifyJWT,getFollowingWebs);
router.route("/trending").get(checkCurrentUser,getTrendingWebs);
router.route("/your-work").get(verifyJWT,getYourWorkWebs);
router.route("/search/my-webs").get(verifyJWT,searchFromWebsCreatedByMe);
router.route("/recomended-people").get(verifyJWT,RecomendedpeopleToFollow);
router.route("/update/:webId").patch(verifyJWT,upload.single("image"),updateWeb);
router.route("/delete/:webId").delete(verifyJWT,deleteWeb);
router.route("/toggle-publish-status/:webId").patch(verifyJWT,togglePublishStatus);
router.route("/inc-view/:webId").patch(updateWebViewCount);
router.route("/search/all-webs").get(checkCurrentUser,searchFromAllWebs);
router.route("/editor-preferences").get(checkCurrentUser,getEditorPreferences);


export default router;