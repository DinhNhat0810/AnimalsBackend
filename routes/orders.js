const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const Book = require("../models/Book");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const User = require("../models/User");
var ObjectId = require("mongodb").ObjectID;
const verify = require("../verifyToken");

function sortObject(obj) {
  var sorted = {};
  var str = [];
  var key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

function paramsToObject(entries) {
  const result = {};
  for (const [key, value] of entries) {
    // each 'entry' is a [key, value] tupple
    result[key] = value;
  }
  return result;
}

router.post("/", async (req, res) => {
  try {
    const getBook = async (ele) => {
      try {
        const book = await Book.findById(ele?.item);
        return book;
      } catch (err) {
        console.log(err);
      }
    };

    req.body?.items.forEach(async (item) => {
      const data = await getBook(item);
      const publicer = await User.findById(data?.publicBy);

      const newOrder = await Order.create({
        items: item,
        owner: req.body.owner,
        shop: data?.publicBy,
        price: (data?.price - (data?.discount * data?.price) / 100) * item?.qty,
        fullname: req.body.fullname,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        province: req.body.province,
        provinceCode: req.body.provinceCode,
        district: req.body.district,
        districtCode: req.body.districtCode,
        commune: req.body.commune,
        communeCode: req.body.communeCode,
        detailAddress: req.body.detailAddress,
      });

      await Book.findByIdAndUpdate(data?._id, {
        $set: {
          limit: data?.limit - item.qty,
          sold: data?.sold + item.qty,
        },
      });

      await User.updateOne(
        { _id: data?.publicBy },
        {
          ordereds:
            publicer?.ordereds?.length !== 0
              ? [...publicer?.ordereds, newOrder?._id]
              : [newOrder?._id],
        }
      );
    });

    await Cart.updateOne({ owner: req.body.owner }, { items: [] });

    res.status(201).json({
      message: "Created successfully!",
      status: "Success",
      // payload: savedOrder,
    });

    // console.log(req.body);

    // var ipAddr =
    //   req.headers["x-forwarded-for"] ||
    //   req.connection.remoteAddress ||
    //   req.socket.remoteAddress ||
    //   req.connection.socket.remoteAddress;

    // var dateFormat = require("dateformat");

    // var tmnCode = "W9AACCB7";
    // var secretKey = "FUFRRDVJCROUFEBISIBTUDHVIAVCNZAU";
    // var vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    // var returnUrl = "http://localhost:3000/myOrder";
    // // http://localhost:8800/api/orders/vnpay_return
    // var date = new Date();

    // var createDate = dateFormat(date, "yyyymmddHHmmss");
    // var orderId = dateFormat(date, "HHmmss");
    // // var amount = req.body.amount;
    // var amount = 100000;
    // var currCode = "VND";
    // var vnp_Params = {};
    // vnp_Params["vnp_Version"] = "2.1.0";
    // vnp_Params["vnp_Command"] = "pay";
    // vnp_Params["vnp_TmnCode"] = tmnCode;
    // // vnp_Params['vnp_Merchant'] = ''
    // vnp_Params["vnp_Locale"] = "vn";
    // vnp_Params["vnp_CurrCode"] = currCode;
    // vnp_Params["vnp_TxnRef"] = orderId;
    // vnp_Params["vnp_OrderInfo"] =
    //   "Thanh+toan+don+hang+thoi+gian%3A+2023-01-03+22%3A52%3A11";
    // vnp_Params["vnp_OrderType"] = "topup";
    // vnp_Params["vnp_Amount"] = amount * 100;
    // vnp_Params["vnp_ReturnUrl"] = returnUrl;
    // vnp_Params["vnp_IpAddr"] = ipAddr;
    // vnp_Params["vnp_CreateDate"] = createDate;
    // vnp_Params["vnp_BankCode"] = "NCB";

    // vnp_Params = sortObject(vnp_Params);

    // var querystring = require("qs");
    // var signData = querystring.stringify(vnp_Params, { encode: false });
    // var crypto = require("crypto");
    // var hmac = crypto.createHmac("sha512", secretKey);
    // var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    // vnp_Params["vnp_SecureHash"] = signed;
    // vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    // console.log(vnpUrl);

    // res.status(200).json({
    //   message: "Success!",
    //   status: "success",
    //   payload: vnpUrl,
    // });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get("/vnpay_return", async (req, res) => {
  try {
    var vnp_Params = req.query;

    var secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    var tmnCode = "W9AACCB7";
    var secretKey = "FUFRRDVJCROUFEBISIBTUDHVIAVCNZAU";

    var querystring = require("qs");
    var signData = querystring.stringify(vnp_Params, { encode: false });
    var crypto = require("crypto");
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const urlParams = new URLSearchParams(vnp_Params);
    const entries = urlParams.entries();
    const params = paramsToObject(entries);

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      // res.status(200).json({
      //   message: "Success!",
      //   status: "success",
      //   payload: params,
      // });

      res.status(200).json({
        message: "Success!",
        status: "success",
        payload: params,
      });
    } else {
      res.status(200).json({
        message: "Success!",
        status: "success",
        payload: "97",
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//UPDATE
// router.put("/update/:id", verify, async (req, res) => {
//   const owner = await User.findOne({ _id: req.user.id });
//   const order = await Order.findOne({ _id: req.params.id });

//   if (
//     req.user.isAdmin ||
//     (owner.userType === "shop" && owner._id.equals(order?.shop))
//   ) {
//     try {
//       const updatedOrder = await Order.findByIdAndUpdate(
//         req.params.id,
//         {
//           $set: { ...req.body },
//         },
//         { new: true }
//       );

//       res.status(200).json({
//         message: "The book has been updated",
//         status: "Success",
//         payload: updatedOrder,
//       });
//     } catch (err) {
//       console.log(err);
//       res.status(500).json(err);
//     }
//   } else {
//     res.status(403).json("You are not allowed!");
//   }
// });

router.put("/update/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { ...req.body },
      },
      { new: true }
    );

    res.status(200).json({
      message: "The book has been updated",
      status: "Success",
      payload: updatedOrder,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/delete/:orderId", async (req, res) => {
  try {
    const result = await Order.findByIdAndDelete(req.params?.orderId);
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

//GET BY ID
router.get("/find/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: "owner",
        select: "username",
      })
      .populate({
        path: "shop",
        select: "username",
      });

    return res.status(401).json({
      status: "Success",
      payload: order,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET BY SHOP
// router.get("/ordered/:shopId", async (req, res) => {
//   try {
//     const order = await Order.find({ shop: req.params.shopId })
//       .populate({
//         path: "owner",
//         select: "username",
//       })
//       .populate({
//         path: "shop",
//         select: "username",
//       });

//     return res.status(401).json({
//       status: "Success",
//       payload: order,
//     });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

//GET BY SHOP
router.get("/ordered/:shopId", async (req, res) => {
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
      populate: [
        {
          path: "items.item",
          select: "title price limit",
          populate: {
            path: "publicBy",
            select: "username",
          },
        },
        {
          path: "owner",
          select: "username",
        },
        {
          path: "shop",
          select: "username",
        },
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(
      { ...searchObj, shop: req.params.shopId },
      options
    );

    res.status(200).json({
      status: "Success",
      payload: orders,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET BY USER
router.get("/owner/:userId", async (req, res) => {
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
      populate: [
        {
          path: "items.item",
          select: "title price limit",
          populate: {
            path: "publicBy",
            select: "username",
          },
        },
        {
          path: "owner",
          select: "username",
        },
        {
          path: "shop",
          select: "username",
        },
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(
      { ...searchObj, owner: req.params.userId },
      options
    );

    res.status(200).json({
      status: "Success",
      payload: orders,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

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
      populate: [
        {
          path: "items.item",
          select: "title price limit",
          populate: {
            path: "publicBy",
            select: "username",
          },
        },
        {
          path: "owner",
          select: "username",
        },
      ],
      sort: { createdAt: -1 },
    };

    const orders = await Order.paginate(searchObj, options);

    res.status(200).json({
      status: "Success",
      payload: orders,
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

//Get user stats
// router.post("/stats", async (req, res) => {
//   try {
//     const data = await Order.aggregate([
//       {
//         $project: {
//           day: { $66`: "$createdAt" },
//         },
//       },
//       {
//         $group: {
//           _id: "$day",
//           total: { $sum: 1 },
//         },
//       },
//     ]).sort({ _id: 1 });

//     res.status(200).json(data);
//     console.log(1);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

router.post("/stats/:shopId", async (req, res) => {
  try {
    console.log(req.params.shopId);
    const data = await Order.aggregate([
      { $match: { shop: ObjectId(req.params.shopId), status: "Đã xác nhận" } },
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
    console.log(err);
    res.status(500).json(err);
  }
});

router.post("/price/:shopId", async (req, res) => {
  try {
    console.log(req.params.shopId);
    const data = await Order.aggregate([
      {
        $match: {
          status: {
            $in: ["Đã xác nhận"],
          },
        },
      },
      {
        $addFields: {
          createdAt: {
            $cond: {
              if: {
                $eq: [
                  {
                    $type: "$createdAt",
                  },
                  "date",
                ],
              },
              then: "$createdAt",
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          __alias_0: {
            date: {
              $dayOfMonth: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            __alias_0: "$__alias_0",
          },
          __alias_1: {
            $sum: "$price",
          },
        },
      },
      {
        $project: {
          _id: 0,
          __alias_0: "$_id.__alias_0",
          __alias_1: 1,
        },
      },
      {
        $project: {
          value: "$__alias_1",
          label: "$__alias_0",
          _id: 0,
        },
      },
      {
        $sort: {
          "label.date": 1,
        },
      },
      {
        $limit: 5000,
      },
    ]);

    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post("/income", async (req, res) => {
  let date = new Date();
  let month = new Date().getMonth();

  let formatPrevMonth = new Date(date.setMonth(month - 1));

  try {
    const income = await Order.aggregate([
      {
        $match: { createdAt: { $gte: formatPrevMonth }, status: "Đã xác nhận" },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          sales: "$price",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);

    res.status(200).json(income);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/revenue/:shopId", async (req, res) => {
  try {
    const income = await Order.aggregate([
      {
        $match: { shop: ObjectId(req.params.shopId), status: "Đã xác nhận" },
      },
      {
        $group: {
          _id: null,
          TotalAmount: {
            $sum: "$price",
          },
        },
      },
    ]);

    res.status(200).json(income);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/success/:shopId", async (req, res) => {
  try {
    const success = await Order.aggregate([
      {
        $match: { shop: ObjectId(req.params.shopId), status: "Đã xác nhận" },
      },
    ]);

    res.status(200).json({
      payload: success?.length,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
