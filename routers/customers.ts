import { Router } from "express";
import razorpay from "../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  const customers = await razorpay.customers.all();
  res.send(customers);
});

export default router;
