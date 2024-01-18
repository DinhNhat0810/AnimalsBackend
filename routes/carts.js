const router = require("express").Router();
const Book = require("../models/Book");
const User = require("../models/User");
const Cart = require("../models/Cart");

const verify = require("../verifyToken");

// ADD TO CART;
router.post("/", async (req, res) => {
  try {
    const { ownerId, productId } = req.body;

    const quantity = Number.parseInt(req.body.quantity);

    let cart = await Cart.findOne({ owner: ownerId });
    let book = await Book.findById(productId);
    if (!book) {
      return res.status(500).json({
        message: "Book not found!",
        status: "error",
      });
    }

    const product = {
      item: book._id,
      qty: quantity,
      price: book.price * quantity,
    };

    if (cart) {
      const checkExistsItem = cart.items.some((ele) => {
        return ele.item.equals(productId);
      });

      const existsItem = cart.items.map((ele) => {
        if (ele.item.equals(productId)) {
          return (ele = product);
        }
        return ele;
      });

      cart.items = checkExistsItem ? existsItem : cart.items.push(product);
      cart.totalPrice = cart.items
        .map((item) => item.price)
        .reduce((acc, next) => acc + next);

      const result = await Cart.findByIdAndUpdate(
        cart._id,
        {
          $set: { totalPrice: cart.totalPrice, items: cart.items },
        },
        { new: true }
      )
        .populate({
          path: "items.item",
          select: "title price limit discount",
          populate: { path: "publicBy", select: "username" },
        })
        .populate({ path: "owner", select: "username" });

      res.status(201).json({
        message: "Add to cart successfully!",
        status: "Success",
        payload: result,
      });
    } else {
      const newCart = new Cart({
        items: product,
        owner: ownerId,
        totalPrice: product.price,
      })
        .populate({
          path: "items.item",
          select: "title price limit discount",
          populate: { path: "publicBy", select: "username" },
        })
        .populate({ path: "owner", select: "username" });
      const result = await newCart.save();
      res.status(201).json({
        message: "Created successfully!",
        status: "Success",
        payload: result,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "Created failed!",
      status: "error",
    });
  }
});

//UPDATE
router.put("/update/:id", verify, async (req, res) => {
  const owner = await User.findOne({ _id: req.user.id });
  const cart = await Cart.findOne({ _id: req.params.id });

  if (req.user.isAdmin || owner?._id.equals(cart?.owner)) {
    try {
      cart.items = req.body.items;
      cart.totalPrice = cart.items
        ?.map((item) => item.price)
        ?.reduce((acc, next) => acc + next, 0);

      const updatedCart = await Cart.findByIdAndUpdate(
        req.params.id,
        {
          $set: { ...req.body, totalPrice: cart.totalPrice, items: cart.items },
        },
        { new: true }
      )
        .populate({
          path: "items.item",
          select: "title price limit discount",
          populate: { path: "publicBy", select: "username" },
        })
        .populate({ path: "owner", select: "username" });
      res.status(200).json({
        message: "The cart has been updated",
        status: "Success",
        payload: updatedCart,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You are not allowed!");
  }
});

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
router.delete("/delete/:cartId", verify, async (req, res) => {
  const owner = await User.findOne({ _id: req.user.id });
  const cart = await Cart.findOne({ _id: req.params.cartId });
  if (req.user.isAdmin || owner._id.equals(cart?.owner)) {
    try {
      const result = await Cart.findByIdAndDelete(req.params?.cartId);
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
    res.status(403).json("You are not allowed!");
  }
});

//GET BY ID
router.get("/find/:cartId", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cartId).populate("title price");
    res.status(200).json({ status: "Success", payload: cart });
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL
router.get("/all", async (req, res) => {
  // if (req.user.isAdmin) {
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

    const carts = await Cart.paginate({}, options);

    res.status(200).json({
      status: "Success",
      payload: carts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
  // } else {
  //   res.status(403).json("You are not allowed!");
  // }
});

//GET BY USER
router.get("/:userId", async (req, res) => {
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
      populate: [
        {
          path: "items.item",
          select: "title price limit discount",
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

    const carts = await Cart.paginate({ owner: req.params.userId }, options);

    res.status(200).json({
      status: "Success",
      payload: carts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
