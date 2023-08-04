import "dotenv/config";
import express from "express";
import helmet from "helmet";
import customerRouter from "./routers/razorpay/customers";
import OrderRouter from "./routers/razorpay/order";
import accountRouter from "./routers/razorpay/account";
import invoiceRouter from "./routers/razorpay/invoice";

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/razorpay/customers", customerRouter);
app.use("/api/razorpay/orders", OrderRouter);
app.use("/api/razorpay/account", accountRouter);
app.use("/api/razorpay/invoice", invoiceRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log("Server started"));
