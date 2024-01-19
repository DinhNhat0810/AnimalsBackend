const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const mongoosePaginate = require("mongoose-paginate-v2");

const AnimalsSchema = new mongoose.Schema(
  {
    nameVi: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true, unique: true },
    descVi: { type: String, required: true },
    descEn: { type: String },
    img: { type: String },
    imgTitleVi: { type: String },
    imgTitleEn: { type: String },
    kingdom: { type: String },
    phylum: { type: String },
    class: { type: String },
    order: { type: String },
    family: { type: String },
    genus: { type: String },
    species: { type: String },
    type: { type: String },
    diet: { type: String },
    size: { type: String },
    weight: { type: String },
    averageLifespan: { type: String },

    // publicBy: { type: mongoose.Types.ObjectId, ref: "user" },
    // updatedBy: { type: mongoose.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

AnimalsSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: "all",
  deletedByType: String,
});

AnimalsSchema.plugin(mongoosePaginate);

const Animal = mongoose.model("animal", AnimalsSchema);

// for (let i = 0; i < 20; i++) {
//   console.log("cho" + i);
//   Animal.create({
//     nameVi: "cho" + i,
//     nameEn: "Dogg" + i,
//     descVi: "con cho rach",
//     descEn: "torn dog",
//     img: "",
//     imgTitleVi: "anh cho rach",
//     imgTitleEn: "torn dog",
//     kingdom: "",
//     phylum: "",
//     class: "",
//     order: "",
//     family: "",
//     genus: "",
//     species: "",
//     type: "Mammals",
//     diet: "Carnivore",
//     size: "6 feet",
//     weight: "30 pound",
//     averageLifespan: "20 nam",
//   });
// }

module.exports = Animal;
