const asyncHandler = (fn) => {
    const handler = async(req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    }
    return handler;
};

const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const sendResponse = (res, status, data) => {
    res.status(status).json(data);
};

module.exports = {
    asyncHandler,
    createError,
    sendResponse
};