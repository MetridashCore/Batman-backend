import "dotenv/config";
import express from "express";
import customerRouter from "./routers/customers";

const app = express();

app.use("/api/customers", customerRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(8000, () => console.log("Server started"));
