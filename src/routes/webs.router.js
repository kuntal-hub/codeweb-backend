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
    getEditorPreferences,
    updateEditorPreferences,
    ChengeEditorView,
    getWebWithoutDteailsById,
    addNewCssLink,
    addNewJsLink,
    removeCssLink,
    removeJsLink,
    addNewHtmlLink,
    removeHtmlLink,
} from "../controllers/web.controller.js"
import {upload} from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/create").post(verifyJWT,upload.single("image"),createWeb);
router.route("/create-forked/:webId").post(verifyJWT,createForkedWeb);
router.route("/get/:webId").get(checkCurrentUser,getWebByWebId);
router.route("/get-without-details/:webId").get(getWebWithoutDteailsById);
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
router.route("/add-css-link/:webId").patch(verifyJWT,addNewCssLink);
router.route("/remove-css-link/:webId").patch(verifyJWT,removeCssLink);
router.route("/add-js-link/:webId").patch(verifyJWT,addNewJsLink);
router.route("/remove-js-link/:webId").patch(verifyJWT,removeJsLink);
router.route("/add-html-link/:webId").patch(verifyJWT,addNewHtmlLink);
router.route("/remove-html-link/:webId").patch(verifyJWT,removeHtmlLink);
router.route("/inc-view/:webId").patch(updateWebViewCount);
router.route("/search/all-webs").get(checkCurrentUser,searchFromAllWebs);
router.route("/editor-preferences").get(checkCurrentUser,getEditorPreferences);
router.route("/update-editor-preferences").patch(verifyJWT,updateEditorPreferences);
router.route("/chenge-editor-view").patch(verifyJWT,ChengeEditorView);


export default router;