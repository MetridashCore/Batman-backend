import { Router } from "express";
import razorpay from "../../services/razorpay";

const router = Router();

router.post("/", async (req, res) => {
  const {
    name,
    contact,
    email,
    billing_address_line1,
    billing_address_line2,
    billing_address_zipcode,
    billing_address_city,
    billing_address_state,
    billing_address_country,
    shipping_address_line1,
    shipping_address_line2,
    shipping_address_zipcode,
    shipping_address_city,
    shipping_address_state,
    shipping_address_country,
    quantity,
    amount,
    line_items_name,
    line_items_description,
  } = req.body;
  try {
    const invoice = await razorpay.invoices.create({
      type: "invoice",
      description: "an invoice",
      partial_payment: false,
      customer: {
        name,
        contact,
        email,
        billing_address: {
          line1: billing_address_line1,
          line2: billing_address_line2,
          zipcode: billing_address_zipcode,
          city: billing_address_city,
          state: billing_address_state,
          country: billing_address_country,
        },
        shipping_address: {
          line1: shipping_address_line1,
          line2: shipping_address_line2,
          zipcode: shipping_address_zipcode,
          city: shipping_address_city,
          state: shipping_address_state,
          country: shipping_address_country,
        },
      },
      line_items: [
        {
          name: line_items_name,
          description: line_items_description,
          amount,
          quantity,
        },
      ],
    });
    return res.send(invoice);
  } catch (ex) {
    return res.send("Error");
  }
});

export default router;
