const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const verify = require("../verifyToken");

//UPDATE
router.put("/:id", verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    const checkUsername = await User.findOne({ username: req.body.username });

    if (checkUsername) {
      return res.status(401).json({
        message: "Username đã tồn tại!",
        status: "Error",
      });
    }

    if (req.body.password) {
      req.body.password = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET_KEY
      ).toString();
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json({
        status: "Success",
        message: "Updated successfully!",
        payload: updatedUser,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

router.put("/infor/:id", verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      const user = await User.findById(req.params.id);
      const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
      if (originalPassword !== req.body.oldPassword) {
        return res.status(401).json({
          message: "Mật khẩu không chính xác!",
          status: "Error",
          // pass: originalPassword,
        });
      }
      if (req.body.password) {
        req.body.password = CryptoJS.AES.encrypt(
          req.body.password,
          process.env.SECRET_KEY
        ).toString();
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      return res.status(200).json({
        status: "Success",
        message: "Updated successfully!",
        payload: updatedUser,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

// //DELETE USER
// router.delete("/delete", verify, async (req, res) => {
//   if (req.user.isAdmin) {
//     try {
//       if (req.body?.userId?.length === 0) {
//         return res.status(401).json({
//           message: "User is not exists!",
//           status: "Error",
//         });
//       }

//       const users = await User.find({});
//       const checkUser = users.filter((item) => {
//         if (req.body?.userIds.includes(item._id.toString())) {
//           return item._id.toString();
//         }
//       });

//       if (checkUser.length !== req.body?.userIds?.length) {
//         return res.status(401).json({
//           message: "One of users is not exists!",
//           status: "Error",
//         });
//       }

//       const result = await User.deleteMany({ _id: req.body?.userIds });

//       return res.status(200).json({
//         message: "Success",
//         status: "Deleted successfully!",
//         payload: result,
//       });
//     } catch (err) {
//       console.log(err);
//       return res.status(500).json(err);
//     }
//   } else {
//     return res.status(403).json("You can delete only your account!");
//   }
// });

//DELETE USER
router.delete("/delete/:userId", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const result = await User.findByIdAndDelete(req.params.userId);

      return res.status(200).json({
        message: "Success",
        status: "Deleted successfully!",
        payload: result,
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account!");
  }
});

//BLOCK USER
router.put("/block/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            isBlocked: true,
            blockedDate: Date.now(),
          },
        },
        { new: true }
      );
      return res.status(200).json({
        message: "Blocked successfully!",
        status: "Success",
        payload: updatedUser,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You can update only your account!");
  }
});

//GET BY ID
router.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...info } = user._doc;
    return res.status(200).json(info);
  } catch (err) {
    return res.status(500).json(err);
  }
});

//GET ALL
router.get("/", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const { limit, page, search } = req.query;
      let searchKeyword = search;
      let searchObj = {};
      if (searchKeyword) {
        searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
          ? {
              $or: [{ username: searchKeyword }, { userType: searchKeyword }],
            }
          : {
              $or: [
                {
                  username: new RegExp(
                    `${searchKeyword.toString().trim()}`,
                    "i"
                  ),
                },
                {
                  userType: new RegExp(
                    `${searchKeyword.toString().trim()}`,
                    "i"
                  ),
                },
              ],
            };
      }

      // const queryFilter =
      //   searchQuery && searchQuery !== "all"
      //     ? {
      //         username: new RegExp(`${typeQuery.toString().trim()}`, "i"),
      //       }
      //     : {};

      // const typeFilter =
      //   typeQuery && typeQuery !== "all"
      //     ? {
      //         userType: new RegExp(`${typeQuery.toString().trim()}`, "i"),
      //       }
      //     : {};

      const myCustomLabels = {
        limit: "perPage",
        page: "currentPage",
        pagingCounter: "slNo",
      };

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        customLabels: myCustomLabels,
        sort: { createdAt: -1 },
      };

      const users = await User.paginate(searchObj, options);

      const decryptPassword = users?.docs?.map((item) => {
        const bytes = CryptoJS.AES.decrypt(
          item.password,
          process.env.SECRET_KEY
        );
        const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
        return {
          ...item._doc,
          password: originalPassword,
        };
      });

      return res.status(200).json({
        status: "Success",
        payload: { ...users, docs: decryptPassword },
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You are not allowed to see all users!");
  }
});

//GET USER STATS
router.get("/stats", async (req, res) => {
  const today = new Date();
  const latYear = today.setFullYear(today.setFullYear() - 1);

  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
