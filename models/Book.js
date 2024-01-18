const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, required: true },
    img: { type: String },
    imgTitle: { type: String },
    nxb: { type: String },
    price: { type: Number },
    discount: { type: Number },
    limit: { type: Number },
    initialLimit: { type: Number },
    sold: { type: Number, default: 0 },
    rating: { type: Number },
    categories: [String],
    author: { type: String },
    publicBy: { type: mongoose.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

BookSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: "all",
  deletedByType: String,
});

BookSchema.plugin(mongoosePaginate);

const Book = mongoose.model("book", BookSchema);

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

module.exports = Book;
