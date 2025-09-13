require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const eventRoutes = require("./routes/eventRoutes");
const videoRoutes = require("./routes/videoRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/events", eventRoutes);
app.use("/upload-video", videoRoutes);
app.use("/report", reportRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo connected");
    app.listen(process.env.PORT || 5000, () => console.log("Server running"));
  })
  .catch(console.error);
