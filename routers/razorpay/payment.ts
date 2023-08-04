import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  const payments = await razorpay.payments.all();
  return res.send(payments);
});

router.get("/:paymentId", async (req, res) => {
  const payment = await razorpay.payments.capture(
    req.params.paymentId,
    req.body.amount,
    "INR"
  );
  return res.send(payment);
});

router.get("/:paymentId", async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId);
  return res.send(payment);
});

export default router;
