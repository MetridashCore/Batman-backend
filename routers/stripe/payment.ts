import { Router } from "express";
const router = Router();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
import express from "express";
router.use(express.json());
router.use(cors());

// checkout api
router.post("/",async(req,res)=>{
    const {products} = req.body;
    console.log(products)

    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: products.prices * 100,
                product_data: {
                  name: `${products.tokens} tokens/${products.words} words`,
                },
                
              },
             
              quantity: 1, // Add this line to specify the quantity
            },
          ],
        mode:"payment",
        success_url:"http://localhost:3000/pricing",
        cancel_url:"http://localhost:3000/pricing",
    });

    res.json({id:session.id})
 
})

export default router;
