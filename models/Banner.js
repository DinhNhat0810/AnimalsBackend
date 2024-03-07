const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const BannerSchemal = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    titleVi: { type: String, required: true },
    titleEn: { type: String, required: true },
    descVi: { type: String, required: true },
    descEn: { type: String, required: true },
    // link: { type: String, required: true },
  },
  { timestamps: true }
);

BannerSchemal.plugin(mongoosePaginate);

const Banner = mongoose.model("banner", BannerSchemal);

module.exports = { Banner };
