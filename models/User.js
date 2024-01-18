const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, defaut: "" },
    isAdmin: { type: Boolean, default: false },
    userType: { type: String },
    isBlocked: { type: Boolean, default: false },
    blockedDate: { type: Date },
    ordereds: [{ type: mongoose.Schema.Types.ObjectID, ref: "order" }],
  },
  { timestamps: true }
);

UserSchema.plugin(mongoosePaginate);

const User = mongoose.model("user", UserSchema);

module.exports = User;
