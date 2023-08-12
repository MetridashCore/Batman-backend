import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const payments = await razorpay.payments.all();
    return res.send(payments);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:paymentId", async (req, res) => {
  try {
    const payment = await razorpay.payments.capture(
      req.params.paymentId,
      req.body.amount,
      "INR"
    );
    return res.send(payment);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:paymentId", async (req, res) => {
  const payment = await razorpay.payments.fetch(req.params.paymentId);
  return res.send(payment);
});

router.get("/:orderId", async (req, res) => {
  const payment = await razorpay.orders.fetchPayments(req.params.orderId);
  return res.send(payment);
});

router.get("/:paymentId", async (req, res) => {
  const cardDetails = await razorpay.payments.fetchCardDetails(
    req.params.paymentId
  );
  return res.send(cardDetails);
});

router.post("/:paymentId", async (req, res) => {
  try {
    const otp = razorpay.payments.otpGenerate(req.params.paymentId);
    return res.send(otp);
  } catch (ex) {
    return res.send("Error");
  }
});

router.post("/:paymentId", async (req, res) => {
  try {
    const otp = await razorpay.payments.otpSubmit(req.params.paymentId, {
      otp: req.body.otp,
    });
    return res.send(otp);
  } catch (ex) {
    return res.send("Error");
  }
});

router.post("/:paymentId", async (req, res) => {
  try {
    const otp = await razorpay.payments.otpResend(req.params.paymentId);
    return res.send(otp);
  } catch (ex) {
    return res.send("Error");
  }
});

export default router;
