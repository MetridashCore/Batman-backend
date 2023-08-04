import { Router } from "express";
import razorpay from "../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  const orders = await razorpay.orders.all();
  res.send(orders);
});

export default router;
