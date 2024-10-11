const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Routes = require("./routes/transactions");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb+srv://Bhavani:Mongodb2002@dreamhouse.uffwh7i.mongodb.net/?retryWrites=true&w=majority&appName=DreamHouse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/", Routes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
