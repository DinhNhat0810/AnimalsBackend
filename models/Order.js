const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const OrderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectID, ref: "user" },
    shop: { type: mongoose.Schema.Types.ObjectID, ref: "user" },
    price: { type: Number },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectID, ref: "book" },
        qty: { type: Number },
        price: { type: Number },
      },
    ],
    status: { type: String, default: "Chờ xác nhận" },
    phoneNumber: { type: Number },
    province: { type: String },
    provinceCode: { type: String },
    district: { type: String },
    districtCode: { type: String },
    commune: { type: String },
    communeCode: { type: String },
    address: { type: String },
    detailAddress: { type: String },
    fullname: { type: String },
  },
  { timestamps: true }
);

OrderSchema.plugin(mongoosePaginate);

const Order = mongoose.model("order", OrderSchema);

// for (let i = 0; i < 20; i++) {
//   Book.create({
//     title: "Sach cua toi " + i,
//     desc: "Mo ta sach cua toi " + i,
//     publicBy: "638c701e166a031344be74ef",
//     price: 30 + i * 10,
//     discount: i * 5,
//     limit: 50,
//     rating: 4,
//     author: "Cat",
//     categories: ["Cổ Tích & Thần Thoại", "Tiểu Thuyết", "Tiểu thuyết cổ điển"],
//   });
// }

module.exports = Order;
