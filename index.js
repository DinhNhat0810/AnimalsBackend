const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv");
var cors = require("cors");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const animalRoute = require("./routes/animals");
const bannerRoute = require("./routes/banners");

dotenv.config();
app.use(cors());
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connection Successfull"))
  .catch((err) => {
    console.error(err);
  });

app.use(express.json());
app.use(morgan("combined"));

app.use("/api/auth", authRoute);
// app.use("/api/users", userRoute);
app.use("/api/animals", animalRoute);
app.use("/api/banners", bannerRoute);
// app.use("/api/categories", categoryRoute);

app.listen(8800, () => {
  console.log("Backend server is running with http://localhost:8800/api");
});
