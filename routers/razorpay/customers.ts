import { Router } from "express";
import razorpay from "../../services/razorpay";

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

router.get("/:customerId", async (req, res) => {
  const customer = await razorpay.customers.fetch(req.params.customerId);
  return res.send(customer);
});

export default router;
