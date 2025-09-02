import multer from "multer";

// WHY USE MULTER FOR FILE STRORAGE BECAUSE IT HAVE THREE PARAMETER (REQ-> IT CONTAINS THE BODY TEXT , FILE-> IT CONTAINS THE FILES , CB-> CALLBACK)

const storage = multer.diskStorage({
  // folder name
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
