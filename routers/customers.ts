import { Router } from "express";
import razorpay from "../services/razorpay";

const router = Router();

router.get("/", async (req, res) => {
  const customers = await razorpay.customers.all();
  res.send(customers);
});

router.post("/", async (req, res) => {
  const { name, email, contact } = req.body;
  try {
    await razorpay.customers.create({
      name,
      contact,
      email,
    });
    return res.send("customer created");
  } catch (error) {
    return res.send("Error");
  }
});

export default router;
