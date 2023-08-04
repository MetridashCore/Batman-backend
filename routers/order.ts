import { Router } from "express";
import razorpay from "../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  const orders = await razorpay.orders.all();
  res.send(orders);
});

router.post("/", async (req, res) => {
  const { amount } = req.body;
  try {
    await razorpay.orders.create({
      amount,
      currency: "INR",
      partial_payment: false,
      receipt: "system order reference id",
    });
    return res.send("order created");
  } catch (ex) {
    return res.send("Error");
  }
});

router.get("/:id", async (req, res) => {
  const order = await razorpay.orders.fetch(req.params.id);
  return res.send(order);
});

export default router;
