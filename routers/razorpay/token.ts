import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/:paymentId", async (req, res) => {
  try {
    const token = await razorpay.payments.fetch(req.params.paymentId);
    return res.send(token);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:customerId", async (req, res) => {
  try {
    const token = await razorpay.customers.fetchTokens(req.params.customerId);
    return res.send(token);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:customerId/:tokenId", async (req, res) => {
  try {
    const token = await razorpay.customers.fetchToken(
      req.params.customerId,
      req.params.tokenId
    );
    return res.send(token);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const token = await razorpay.tokens.fetch({ id: req.params.id });
    return res.send(token);
  } catch (error) {
    return res.send(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await razorpay.tokens.delete({ id: req.params.id });
    return res.send(true);
  } catch (error) {
    return res.send(error);
  }
});

export default router;
