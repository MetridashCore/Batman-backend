import "dotenv/config";
import express from "express";
import customerRouter from "./routers/razorpay/customers";
import OrderRouter from "./routers/razorpay/order";
import accountRouter from "./routers/razorpay/account";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/razorpay/api/customers", customerRouter);
app.use("/razorpay/api/orders", OrderRouter);
app.use("/razorpay/api/account", accountRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log("Server started"));
