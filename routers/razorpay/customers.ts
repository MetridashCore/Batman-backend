import { Router } from "express";
import { z } from "zod";
import razorpay from "../../services/razorpay";

const router = Router();

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Email is required" }),
  contact: z.number({
    required_error:
      "Contact number should be at least 8 digits, including country code",
    invalid_type_error: "Only Number is allowed",
  }),
});

router.get("/", async (req, res) => {
  try {
    const customers = await razorpay.customers.all();
    res.send(customers);
  } catch (error) {
    res.send(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const data = schema.parse(req.body);
    const { name, email, contact } = data;
    const customer = await razorpay.customers.create({
      name,
      contact,
      email,
    });
    return res.send(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.send(error.issues[0].message);
    }
    return res.send(error);
  }
});

router.get("/:customerId", async (req, res) => {
  try {
    const customer = await razorpay.customers.fetch(req.params.customerId);
    return res.send(customer);
  } catch (error) {
    return res.send(error);
  }
});

export default router;
