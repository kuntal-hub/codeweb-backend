import { ApiResponce } from "../utils/ApiResponce";
import { asyncHandler } from "../utils/asyncHandler";

const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponce(200, "Ok", "Server is up and running"));
});

export { healthCheck };