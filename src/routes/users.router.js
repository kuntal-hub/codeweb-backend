import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    chengePassword,
    chengeEmail,
    deleteUser,
    requestVerifyEmail,
    verifyEmail,
    requestForgotPasswordEmail,
    resetPassword,
    Updateduser,
    updateAvatar,
    updateCoverImage,
    getUserProfile,
    getPinedItems,
    addToPinedItems,
    removePinedItem,
    updateShowcase
} from "../controllers/user.controller.js"

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/me").get(verifyJWT,getCurrentUser);
router.route("/change-password").post(verifyJWT,chengePassword);
router.route("/change-email").post(verifyJWT,chengeEmail);
router.route("/delete").delete(verifyJWT,deleteUser);
router.route("/request-verify-email").post(verifyJWT,requestVerifyEmail);
router.route("/verify-email").post(verifyEmail);
router.route("/request-forgot-password-email").post(requestForgotPasswordEmail);
router.route("/reset-password").post(resetPassword);
router.route("/update").patch(verifyJWT,Updateduser);
router.route("/update-avatar").patch(verifyJWT,updateAvatar);
router.route("/update-cover-image").patch(verifyJWT,updateCoverImage);
router.route("/getuser/:username").get(getUserProfile);
router.route("/pined").get(verifyJWT,getPinedItems);
router.route("/add-to-pined/:webId").patch(verifyJWT,addToPinedItems);
router.route("/remove-pined/:webId").patch(verifyJWT,removePinedItem);
router.route("/update-showcase").patch(verifyJWT,updateShowcase);



export default router;