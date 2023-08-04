import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.post("/", async (req, res) => {
  const { name, description, amount } = req.body;
  const item = await razorpay.items.create({
    name,
    description,
    amount,
    currency: "INR",
  });
  return res.send(item);
});

export default router;
