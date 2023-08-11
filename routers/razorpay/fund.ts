import { Router } from "express";
import { z } from "zod";
import razorpay from "../../services/razorpay";

const router = Router();

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  account_number: z.string().min(1, { message: "Account Number is required" }),
  ifsc: z.string().min(1, { message: "IFSC is required" }),
});

router.get("/:customerId", async (req, res) => {
  try {
    const allFund = await razorpay.fundAccount.fetch(req.params.customerId);
    return res.send(allFund);
  } catch (error) {
    return res.send(error);
  }
});

router.post("/:customerId", async (req, res) => {
  try {
    const { name, account_number, ifsc } = schema.parse(req.body);
    const fund = await razorpay.fundAccount.create({
      customer_id: req.params.customerId,
      account_type: "bank_account",
      bank_account: {
        name,
        account_number,
        ifsc,
      },
    });
    return res.send(fund);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.send(error.issues[0].message);
    }
    return res.send(error);
  }
});

export default router;
