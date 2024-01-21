const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const Animal = require("../models/Animals");
const User = require("../models/User");

const verify = require("../verifyToken");

// CREATE;
router.post("/create", verify, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const checkNameVi = await Animal.findOne({ nameVi: req.body.nameVi });
      const checkNameEn = await Animal.findOne({ nameEn: req.body.nameEn });

      if (checkNameVi) {
        return res.status(200).json({
          message: "NameVi already exists",
          status: "error",
        });
      }

      if (checkNameEn) {
        return res.status(200).json({
          message: "NameEn already exists",
          status: "error",
        });
      }

      const newAnimal = new Animal({ ...req.body });
      const savedAnimal = await newAnimal.save();
      res.status(201).json({
        message: "Created successfully!",
        status: "Success",
        payload: savedAnimal,
      });
    } else {
      res.status(403).json({
        message: "You are not allowed!",
        status: "Error",
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/update/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const checkNameVi = await Animal.findOne({ nameVi: req.body.nameVi });
      const checkNameEn = await Animal.findOne({ nameEn: req.body.nameEn });

      if (checkNameVi && req.params.id !== checkNameVi?._id.toString()) {
        return res.status(200).json({
          message: "NameVi already exists",
          status: "error",
        });
      }

      if (checkNameEn && req.params.id !== checkNameEn?._id.toString()) {
        return res.status(200).json({
          message: "NameEn already exists",
          status: "error",
        });
      }

      const updatedAnimal = await Animal.findByIdAndUpdate(
        req.params.id,
        {
          $set: { ...req.body },
        },
        { new: true }
      );

      res.status(200).json({
        message: "This animal has been updated",
        status: "Success",
        payload: updatedAnimal,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json({
      message: "You are not allowed!",
      status: "Error",
    });
  }
});

//DELETE
router.put("/remove", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const checkExists = await Animal.findById(req.body?.id);
      if (!checkExists) {
        return res.status(200).json({
          message: "This record is not exists!",
          status: "error",
        });
      }

      await Animal.delete({ _id: req.body?.id });

      return res.status(200).json({
        message: "Delete successfully!",
        status: "Success",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Delete failure!",
        status: "Error",
      });
    }
  } else {
    res.status(403).json({
      message: "You are not allowed!",
      status: "Error",
    });
  }
});

//RESTORE
router.put("/restore", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const checkExists = await Animal.findOneDeleted({ _id: req.body?.id });
      if (!checkExists) {
        return res.status(200).json({
          message: "This record is not exists!",
          status: "error",
        });
      }

      const result = await Animal.restore({ _id: req.body?.id });

      return res.status(200).json({
        message: "Restore successfully!",
        status: "Success",
        payload: result,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Restore failure!",
        status: "Error",
      });
    }
  } else {
    res.status(403).json({
      message: "You are not allowed!",
      status: "Error",
    });
  }
});

//Force DELETE
router.delete("/force-delete", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const result = await Animal.remove({ _id: req.body?.id });
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
  } else {
    res.status(403).json({
      message: "You are not allowed!",
      status: "Error",
    });
  }
});

//GET BY ID
router.get("/find/:id", async (req, res) => {
  try {
    if (!req.params.id?.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(401).json({
        message: "This record is not exists!",
        status: "Failed",
      });
    }
    const animal = await Animal.findOne({ _id: req.params.id });

    console.log(animal);

    if (!animal) {
      return res.status(401).json({
        message: "This record is not exists!",
        status: "Failed",
      });
    }

    res.status(200).json(animal);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET BY ID (include deleted)
router.get("/findWithDeleted/:id", async (req, res) => {
  try {
    if (!req.params.id?.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(401).json({
        message: "This record is not exists!",
        status: "Failed",
      });
    }
    const animal = await Animal.findOneWithDeleted({ _id: req.params.id });

    if (!animal) {
      return res.status(401).json({
        message: "This record is not exists!",
        status: "Failed",
      });
    }

    res.status(200).json(animal);
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
              { nameVi: searchKeyword },
              { descVi: searchKeyword },
              { nameEn: searchKeyword },
              { descEn: searchKeyword },
            ],
          }
        : {
            $or: [
              {
                nameVi: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                descVi: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                nameEn: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
              {
                descEn: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
              },
            ],
          };
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      customLabels: myCustomLabels,
      // populate: {
      //   path: "publicBy updatedBy",
      //   select: "username",
      // },
      sort: { createdAt: -1 },
    };

    const animals = await Animal.paginate(searchObj, options);

    res.status(200).json({
      status: "Success",
      payload: animals,
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
