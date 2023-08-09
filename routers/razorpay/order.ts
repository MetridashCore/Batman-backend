import { Router } from "express";
import { z } from "zod";
import razorpay from "../../services/razorpay";

const router = Router();

const schema = z.object({
  amount: z
    .number({
      invalid_type_error: "Only Number is allowed",
      required_error: "The amount must be atleast INR 1.00",
    })
    .min(1, { message: "Amount must be less than or equal to 1.00 INR" }),
});

router.get("/", async (req, res) => {
  try {
    const orders = await razorpay.orders.all();
    return res.send(orders);
  } catch (error) {
    return res.send(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { amount } = schema.parse(req.body);
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      partial_payment: false,
    });
    return res.send(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.send(error.issues[0].message);
    }
    return res.send(error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await razorpay.orders.fetch(req.params.id);
    return res.send(order);
  } catch (error) {
    return res.send(error);
  }
});

export default router;
