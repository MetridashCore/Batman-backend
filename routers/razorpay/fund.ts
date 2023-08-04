import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.post("/:customerId", async (req, res) => {
  const { name, account_number, ifsc } = req.body;
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
});

export default router;
