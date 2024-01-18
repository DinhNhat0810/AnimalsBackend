const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var CartSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectID, ref: "user" },
  totalPrice: { type: Number, default: 0 },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectID, ref: "book" },
      qty: { type: Number },
      price: { type: Number },
    },
  ],
});
CartSchema.plugin(mongoosePaginate);

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
