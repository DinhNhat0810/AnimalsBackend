const router = require("express").Router();
const { Banner } = require("../models/Banner");

const verify = require("../verifyToken");

//CREATE Banner
router.post("/add", verify, async (req, res) => {
  if (req.user.isAdmin) {
    const checkTitleVi = await Banner.findOne({ titleVi: req.body.titleVi });
    const checkTitleEn = await Banner.findOne({ titleEn: req.body.titleEn });

    if (checkTitleVi) {
      return res.status(200).json({
        message: "Title Vi already exists",
        status: "error",
      });
    }

    if (checkTitleEn) {
      return res.status(200).json({
        message: "Title En already exists",
        status: "error",
      });
    }

    const newBanner = new Banner(req.body);
    try {
      const savedBanner = await newBanner.save();
      return res.status(201).json({
        message: "Create successfully!",
        status: "success",
        payload: savedBanner,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

// DELETE Banner
router.delete("/delete/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await Banner.findByIdAndDelete(req.params?.id);
      res.status(201).json({
        message: "Delete successfully!",
        status: "success",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

// GET Banner
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

    const banners = await Banner.paginate({}, options);
    return res.status(201).json({
      status: "success",
      payload: banners,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// GET BANNER BY ID
router.get("/find/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    return res.status(201).json({
      status: "success",
      payload: banner,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE BANNER
router.put("/update/:id", verify, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const checkTitle = await Banner.findOne({ _id: req.params.id });

      if (checkTitle && req.params.id !== checkTitle?._id.toString()) {
        return res.status(400).json({
          message: "Title is exists!",
          status: "Error",
        });
      }

      const updatedBanner = await Banner.findByIdAndUpdate(
        req.params.id,
        {
          $set: { ...req.body, updatedBy: "admin" },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Banner has been updated",
        status: "success",
        payload: updatedBanner,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

module.exports = router;
