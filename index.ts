import "dotenv/config";
import express from "express";
import customerRouter from "./routers/customers";
import OrderRouter from "./routers/order";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/customers", customerRouter);
app.use("/api/orders", OrderRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log("Server started"));
