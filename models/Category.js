const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contents: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.plugin(mongoosePaginate);

const Category = mongoose.model("category", CategorySchema);

module.exports = { Category };
