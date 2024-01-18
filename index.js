const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const dotenv = require("dotenv");
var cors = require("cors");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const bookRoute = require("./routes/books");
const categoryRoute = require("./routes/categories");
const cartRoute = require("./routes/carts");
const orderRoute = require("./routes/orders");

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
app.use("/api/users", userRoute);
app.use("/api/books", bookRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/carts", cartRoute);
app.use("/api/orders", orderRoute);

app.listen(8800, () => {
  console.log("Backend server is running with http://localhost:8800/api!");
});
