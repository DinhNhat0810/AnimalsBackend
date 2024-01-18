const router = require("express").Router();
const Book = require("../models/Book");
const User = require("../models/User");

const verify = require("../verifyToken");

// CREATE;
router.post("/", verify, async (req, res) => {
  try {
    const owner = await User.findOne({ _id: req.user.id });

    if (req.user.isAdmin || owner.userType === "shop") {
      const newBook = new Book({ ...req.body, initialLimit: req.body?.limit });
      const savedBook = await newBook.save();
      res.status(201).json({
        message: "Created successfully!",
        status: "Success",
        payload: savedBook,
      });
    } else {
      res.status(403).json("You are not authorized!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      {
        $set: { ...req.body },
      },
      { new: true }
    );

    res.status(200).json({
      message: "The book has been updated",
      status: "Success",
      payload: updatedBook,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//UPDATE
// router.put("/update/:id",verify, async (req, res) => {
//   const owner = await User.findOne({ _id: req.user.id });
//   const book = await Book.findOne({ _id: req.params.id });

//   if (
//     req.user.isAdmin ||
//     (owner.userType === "shop" && owner._id.equals(book?.publicBy))
//   ) {
//     try {
//       const updatedBook = await Book.findByIdAndUpdate(
//         req.params.id,
//         {
//           $set: { ...req.body },
//         },
//         { new: true }
//       );

//       res.status(200).json({
//         message: "The book has been updated",
//         status: "Success",
//         payload: updatedBook,
//       });
//     } catch (err) {
//       console.log(err);
//       res.status(500).json(err);
//     }
//   } else {
//     res.status(403).json("You are not allowed!");
//   }
// });

// //DELETE
// router.put("/delete", verify, async (req, res) => {
//   if (req.body?.bookIds?.length === 0) {
//     return res.status(401).json({
//       message: "Book is not exists!",
//       status: "Error",
//     });
//   }
//   const owner = await User.findOne({ _id: req.user.id });
//   const publicBy = req.user.isAdmin ? {} : { publicBy: req.user.id };
//   const bookOfSeller = await Book.find(publicBy);
//   const bookDeleted = bookOfSeller.filter((item) => {
//     if (req.body?.bookIds?.includes(item._id.toString()) && item.isDeleted) {
//       return item._id.toString();
//     }
//   });
//   if (bookDeleted.length !== 0) {
//     return res.status(401).json({
//       message: "One of book is not exists!",
//       status: "Error",
//     });
//   }
//   const bookOfSellerIds = bookOfSeller.map((item) => item._id.toString());
//   const isBookOfSeller = req.body?.bookIds?.every((item) => {
//     return bookOfSellerIds.includes(item);
//   });
//   if (req.user.isAdmin || (owner?.userType === "seller" && isBookOfSeller)) {
//     try {
//       const result = await Book.updateMany(
//         { _id: req.body?.bookIds },
//         {
//           $set: {
//             isDeleted: true,
//             deletedDate: Date.now(),
//           },
//         }
//       );
//       return res.status(200).json({
//         message: "Delete successfully!",
//         status: "Success",
//         payload: result,
//       });
//     } catch (err) {
//       res.status(500).json({
//         message: "Delete failure!",
//         status: "Error",
//       });
//     }
//   } else {
//     res.status(403).json("You are not allowed!");
//   }
// });

//DELETE
router.delete("/delete/:bookId", verify, async (req, res) => {
  try {
    const result = await Book.delete({ _id: req?.params?.bookId });
    return res.status(200).json({
      message: "Delete successfully!",
      status: "Success",
      payload: result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Delete failure!",
      status: "Error",
    });
  }
});

//Force DELETE
router.delete("/force-delete", verify, async (req, res) => {
  console.log(req.body);
  if (req.user.isAdmin) {
    try {
      // const result = await Book.deleteMany({ _id: req.body?.bookIds });
      // return res.status(200).json({
      //   message: "Delete successfully!",
      //   status: "Success",
      //   payload: result,
      // });
    } catch (err) {
      res.status(500).json({
        message: "Delete failure!",
        status: "Error",
      });
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

//GET BY ID
router.get("/find/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate({
      path: "publicBy",
      select: "username",
      // populate: { path: "detail", select: "code" },
    });

    if (book?.isDeleted === true) {
      return res.status(401).json({
        message: "Book is not exists!",
        status: "Failed",
      });
    }

    res.status(200).json(book);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET RANDOM

// router.get("/random", verify, async (req, res) => {
//   const type = req.query.type;
//   let movie;
//   try {
//     if (type === "series") {
//       movie = await Movie.aggregate([
//         { $match: { isSeries: true } },
//         { $sample: { size: 1 } },
//       ]);
//     } else {
//       movie = await Movie.aggregate([
//         { $match: { isSeries: false } },
//         { $sample: { size: 1 } },
//       ]);
//     }
//     res.status(200).json(movie);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

//GET ALL
router.get("/all", async (req, res) => {
  try {
    const { limit, page, search } = req.query;
    const myCustomLabels = {
      limit: "perPage",
      page: "currentPage",
      pagingCounter: "slNo",
    };

    let searchKeyword = search;
    let searchObj = {};
    if (searchKeyword) {
      searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
        ? {
            $or: [
              { title: searchKeyword },
              { desc: searchKeyword },
              { author: searchKeyword },
            ],
          }
        : {
            $or: [
              {
                title: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                desc: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                author: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
            ],
          };
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      populate: {
        path: "publicBy updatedBy",
        select: "username",
      },
      sort: { createdAt: -1 },
    };

    const books = await Book.paginate(searchObj, options);

    res.status(200).json({
      status: "Success",
      payload: books,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/sold", async (req, res) => {
  try {
    const { limit, page, search } = req.query;
    const myCustomLabels = {
      limit: "perPage",
      page: "currentPage",
      pagingCounter: "slNo",
    };

    let searchKeyword = search;
    let searchObj = {};
    if (searchKeyword) {
      searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
        ? {
            $or: [
              { title: searchKeyword },
              { desc: searchKeyword },
              { author: searchKeyword },
            ],
          }
        : {
            $or: [
              {
                title: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                desc: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                author: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
            ],
          };
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      populate: {
        path: "publicBy updatedBy",
        select: "username",
      },
      sort: { sold: -1 },
    };

    const books = await Book.paginate(searchObj, options);

    res.status(200).json({
      status: "Success",
      payload: books,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//Category
router.get("/categories/:category", async (req, res) => {
  try {
    const { limit, page } = req.query;
    const myCustomLabels = {
      limit: "perPage",
      page: "currentPage",
      pagingCounter: "slNo",
    };

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      populate: {
        path: "publicBy updatedBy",
        select: "username",
      },
      sort: { createdAt: -1 },
    };

    const books = await Book.paginate(
      { categories: req.params.category },
      options
    );

    res.status(200).json({
      status: "Success",
      payload: books,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//SEARCH
router.get("/search", async (req, res) => {
  try {
    const { limit, page, category, price, rating, title } = req.query;
    const categoryQuery = category || "";
    const priceQuery = price || "";
    const ratingQuery = rating || "";
    const searchQuery = title || "";

    const queryFilter =
      searchQuery && searchQuery !== ""
        ? {
            title: new RegExp(`${searchQuery.toString().trim()}`, "i"),
          }
        : {};

    const categoryFilter =
      categoryQuery && categoryQuery !== "" ? { categoryQuery } : {};

    const ratingFilter =
      ratingQuery && ratingQuery !== ""
        ? {
            rating: {
              $gte: Number(ratingQuery),
            },
          }
        : {};

    const priceFilter =
      priceQuery && priceQuery !== ""
        ? {
            // 1-50
            price: {
              $gte: Number(priceQuery.split("-")[0]),
              $lte: Number(priceQuery.split("-")[1]),
            },
          }
        : {};

    let searchObj = {
      $or: [
        {
          ...queryFilter,
        },
        // {
        //   categoryFilter,
        // },
        // {
        //   priceFilter,
        // },
        // {
        //   ratingFilter,
        // },
      ],
    };

    console.log(searchObj);

    const myCustomLabels = {
      limit: "perPage",
      page: "currentPage",
      pagingCounter: "slNo",
    };

    // let searchKeyword = search;
    // let searchObj = {};
    // if (searchKeyword) {
    //   searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
    //     ? {
    //         $or: [
    //           { title: searchKeyword },
    //           { desc: searchKeyword },
    //           { author: searchKeyword },
    //         ],
    //       }
    //     : {
    //         $or: [
    //           {
    //             title: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
    //           },
    //           {
    //             desc: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
    //           },
    //           {
    //             author: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
    //           },
    //         ],
    //       };
    // }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      populate: {
        path: "publicBy updatedBy",
        select: "username",
      },
      sort: { createdAt: -1 },
    };

    const books = await Book.paginate(searchObj, options);

    res.status(200).json({
      status: "Success",
      payload: books,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET BY USER
router.get("/:userId", async (req, res) => {
  const owner = await User.findOne({ _id: req.params.userId });

  if (owner?.userType === "shop" || owner.userType === "admin") {
    try {
      const { limit, page } = req.query;
      const myCustomLabels = {
        limit: "perPage",
        page: "currentPage",
        pagingCounter: "slNo",
      };

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        customLabels: myCustomLabels,
        populate: {
          path: "publicBy",
          select: "username",
        },
        sort: { createdAt: -1 },
      };

      const books = await Book.paginate({ publicBy: owner?._id }, options);

      res.status(200).json({
        status: "Success",
        payload: books,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
});

//GET NEWEST BOOK
router.get("/newest", async (req, res) => {
  try {
    const { limit, page } = req.query;
    const myCustomLabels = {
      limit: "perPage",
      page: "currentPage",
      pagingCounter: "slNo",
    };

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      populate: {
        path: "publicBy",
        select: "username",
      },
      sort: { createdAt: -1 },
    };

    const books = await Book.paginate({}, options);

    res.status(200).json({
      status: "Success",
      payload: books,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//GET RANDOM BOOK
router.get("/random/books", async (req, res) => {
  try {
    const randomBook = await Book.aggregate([{ $sample: { size: 10 } }]);

    res.status(200).json({
      status: "Success",
      payload: randomBook,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
