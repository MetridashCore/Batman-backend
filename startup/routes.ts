import type { Express } from "express";
import express from "express";
import customerRouter from "../routers/razorpay/customers";
import OrderRouter from "../routers/razorpay/order";
import accountRouter from "../routers/razorpay/account";
import invoiceRouter from "../routers/razorpay/invoice";
import itemsRouter from "../routers/razorpay/items";
import tokenRouter from "../routers/razorpay/token";
import fundRouter from "../routers/razorpay/fund";
import paymentRouter from "../routers/razorpay/payment";
import stripePayment from '../routers/stripe/payment';
import error from "./error";

export default function (app: Express) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/razorpay/customers", customerRouter);
  app.use("/api/razorpay/orders", OrderRouter);
  app.use("/api/razorpay/account", accountRouter);
  app.use("/api/razorpay/invoice", invoiceRouter);
  app.use("/api/razorpay/items", itemsRouter);
  app.use("/api/razorpay/token", tokenRouter);
  app.use("/api/razorpay/fund", fundRouter);
  app.use("/api/razorpay/payment", paymentRouter);
  app.use('/stripe-payment', stripePayment);
 
  error(app);
}
