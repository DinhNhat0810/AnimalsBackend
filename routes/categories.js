const router = require("express").Router();
const { Category } = require("../models/Category");

const verify = require("../verifyToken");

//CREATE Category
router.post("/add", verify, async (req, res) => {
  if (req.user.isAdmin) {
    const isCheckCategory = await Category.findOne({ name: req.body.name });
    const newCategory = new Category(req.body);

    if (isCheckCategory) {
      return res.status(401).json({
        message: "Tên thể loại đã tồn tại!",
        status: "Error",
      });
    }

    try {
      const savedList = await newCategory.save();
      return res.status(201).json({
        message: "Create successfully!",
        status: "Success",
        payload: savedList,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

// DELETE Category
router.delete("/delete/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await Category.findByIdAndDelete(req.params?.id);
      res.status(201).json({
        message: "Delete successfully!",
        status: "Success",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

// GET Category
router.get("/all", async (req, res) => {
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
    };

    const categories = await Category.paginate({}, options);
    return res.status(201).json({
      status: "Success",
      payload: categories,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// GET MENU BY ID
router.get("/find/:id", async (req, res) => {
  try {
    const menu = await Category.findById(req.params.id);
    return res.status(201).json({
      status: "Success",
      payload: menu,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE MENU
router.put("/update/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const menu = await Category.findOne({ _id: req.params.id });

      if (req.body?.name === menu.name) {
        return res.status(400).json({
          message: "Menu name is exists!",
          status: "Error",
        });
      }

      const updatedMenu = await Category.findByIdAndUpdate(
        req.params.id,
        {
          $set: { ...req.body, updatedBy: "admin" },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Menu has been updated",
        status: "Success",
        payload: updatedMenu,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

module.exports = router;
