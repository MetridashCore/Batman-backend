import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/:customerId", async (req, res) => {
  const allFund = await razorpay.fundAccount.fetch(req.params.customerId);
  return res.send(allFund);
});

router.post("/:customerId", async (req, res) => {
  const { name, account_number, ifsc } = req.body;
  try {
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
  } catch (ex) {
    return res.send("Error");
  }
});

export default router;
