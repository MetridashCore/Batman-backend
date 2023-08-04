import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/:paymentId", async (req, res) => {
  const token = await razorpay.payments.fetch(req.params.paymentId);
  return res.send(token);
});

router.get("/:customerId", async (req, res) => {
  const token = await razorpay.customers.fetchTokens(req.params.customerId);
  return res.send(token);
});

router.get("/:customerId/:tokenId", async (req, res) => {
  const token = await razorpay.customers.fetchToken(
    req.params.customerId,
    req.params.tokenId
  );
  return res.send(token);
});

router.get("/:id", async (req, res) => {
  const token = await razorpay.tokens.fetch({ id: req.params.id });
  return res.send(token);
});

export default router;
