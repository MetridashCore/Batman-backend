import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/:paymentId", async (req, res) => {
  const payment = await razorpay.payments.capture(
    req.params.paymentId,
    req.body.amount,
    "INR"
  );
  return res.send(payment);
});

export default router;
