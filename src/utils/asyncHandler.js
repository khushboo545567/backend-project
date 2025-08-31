// HE HAVE TO CONNECT THE MONGODB AGAIN AND AGAIN SO THATS WHY WE ADDED INTO THE UTILS SO THAT WE CAN USE IT ANY WHERE WE WANT

const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error),
    );
  };
};

export { asyncHandler };
// ANOTHER WAY TO THIS
// const asyncHandler = (fn) => {
//   async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       res.status(error.code || 500).json({
//         success:false,
//         message:error.message
//       });
//     }
//   };
// };
