require('dotenv').config()

import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import http from "http";

import connectDB from "./src/utils/connectDB";
import { createDefaultRole } from "./src/models/role.model";
import { createDefaultAdmin } from "./src/models/user.model";
import { createDefaultSchedule } from "./src/models/schedule.model";
import router from "./src/routers";

const app = express();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const createDefaultData = async () => {
  await connectDB.createConnect();
  await createDefaultRole();
  await createDefaultAdmin();
  createDefaultSchedule();
}

createDefaultData();

app.use("/public", express.static("public"));
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.use("/api", router);


app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message;
  res.status(status).send({
    message: message,
  });
});

app.use((req, res, next) => {
  res.status(404).send({
    message: "API NOT FOUND",
    statusCode: 404
  })
})

server.listen(PORT, () => {
  console.log(`SERVER START AT PORT ${PORT}`)
})