import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.get("/:id", async (req, res) => {
  const account = await razorpay.accounts.fetch(req.params.id);
  return res.send(account);
});

router.post("/", async (req, res) => {
  const {
    email,
    phone,
    legal_business_name,
    customer_facing_business_name,
    business_type,
    contact_name,
    category,
    subcategory,
    description,
    street1,
    street2,
    city,
    state,
    postal_code,
    country,
    business_model,
    pan,
    gst,
  } = req.body;
  try {
    const account = await razorpay.accounts.create({
      email,
      phone,
      legal_business_name,
      customer_facing_business_name,
      business_type,
      contact_name,
      profile: {
        category,
        subcategory,
        description,
        addresses: {
          operation: {
            street1,
            street2,
            city,
            state,
            postal_code,
            country,
          },
        },
        business_model,
      },
      legal_info: {
        pan,
        gst,
      },
    });
    return res.send(account);
  } catch (ex) {
    return res.send("Error");
  }
});

export default router;
