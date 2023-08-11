import { Router } from "express";
import { z } from "zod";
import razorpay from "../../services/razorpay";

const router = Router();

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  amount: z
    .number({
      required_error: "The amount must be at least INR 1.00",
      invalid_type_error: "Only Number is allowed",
    })
    .min(1, { message: "The amount must be at least INR 1.00" }),
});

router.get("/", async (req, res) => {
  try {
    const items = await razorpay.items.all();
    return res.send(items);
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await razorpay.items.fetch(req.params.id);
    return res.send(item);
  } catch (error) {
    return res.send(error);
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, amount } = schema.parse(req.body);
    const item = await razorpay.items.create({
      name,
      description,
      amount: amount * 100,
      currency: "INR",
    });
    return res.send(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.send(error.issues[0].message);
    }
    return res.send(error);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, amount } = schema.parse(req.body);
    const item = await razorpay.items.edit(req.params.id, {
      name,
      description,
      amount,
    });
    return res.send(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.send(error.issues[0].message);
    }
    return res.send(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await razorpay.items.delete(req.params.id);
    return res.send(true);
  } catch (error) {
    return res.send(error);
  }
});

export default router;
