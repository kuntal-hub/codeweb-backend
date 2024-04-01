import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "./middlewares/errorHendeler.middleware.js";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    optionsSuccessStatus:200,
    credentials:true
}))
app.use(express.json({limit:"5mb"}));
app.use(express.urlencoded({extended:true,limit:"5mb"}));
app.use(cookieParser());
app.use(express.static("dist"));

// import all routes

import userRouter from "./routes/users.router.js";
import webRouter from "./routes/webs.router.js";
import replayRouter from "./routes/replays.router.js";
import likeRouter from "./routes/likes.router.js";
import commentRouter from "./routes/comments.router.js";
import healthCheckRouter from "./routes/healthCheck.router.js";
import followerRouter from "./routes/followers.router.js";
import collectionRouter from "./routes/collections.router.js";
import assetRouter from "./routes/assets.router.js";
import savedCollectionsRouter from "./routes/savedCollections.router.js";

// use all routes
app.use("/api/v1/users",userRouter);
app.use("/api/v1/webs",webRouter);
app.use("/api/v1/replays",replayRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/healthCheck",healthCheckRouter);
app.use("/api/v1/followers",followerRouter);
app.use("/api/v1/collections",collectionRouter);
app.use("/api/v1/assets",assetRouter);
app.use("/api/v1/savedCollections",savedCollectionsRouter);

app.use(errorHandler);

export default app;