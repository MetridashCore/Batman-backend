import { Router, Request, Response } from "express";
import stripe from "../../services/stripe";
import admin from "./../../firebase";

declare global {
  namespace Express {
    interface Request {
      user?: { uid: string };
    }
  }
}

const DOMAIN = 'http://localhost:1337'

const router = Router();

router.get('/delete', async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  const doc = await admin.firestore().collection('api_keys').doc().get();
  
  if (!doc.exists) {
    res.status(400).send({ 'status': "API Key does not exist" });
  } else {
    const { stripeCustomerId, userIds } = doc.data() ?? {};

    if (!userIds.includes(userId)) {
      res.status(403).send({ 'status': "Access denied" });
    } else {
      try {
        const customer = await stripe.customers.retrieve(
          stripeCustomerId,
          { expand: ['subscriptions'] }
        );
        console.log(customer);
        let subscriptionId = customer?.subscriptions?.data?.[0]?.id;
        
        if (subscriptionId && customer.subscriptions.data[0].status !== 'incomplete') {
          await stripe.subscriptions.del(subscriptionId);
        }

        const data = {
          status: null
        };
        await admin.firestore().collection('api_keys').doc().set(data, { merge: true });
        
        res.status(200).send({ 'status': 'Subscription cancelled' });
      } catch (err) {
        return res.sendStatus(500);
      }
    }
  }
});

router.post('/create-checkout-session/:product', async (req: Request, res: Response) => {
  const { product } = req.params;
  const userId = req.user?.uid;
  let mode: string, price_ID: string, line_items: any[], quantity_type: any, token: string;

  if (product === 'pre1') {
    price_ID = 'price_1NiyeaGo36tEddLKI8NHcixv';
    mode = 'payment';
    line_items = [
      {
        price: price_ID,
        quantity: 1
      }
    ];
    quantity_type = 100;
  } else if (product === 'pre2') {
    price_ID = 'price_1NiywxGo36tEddLKhkEG01l5';
    mode = 'payment';
    line_items = [
      {
        price: price_ID,
        quantity: 1
      }
    ];
    quantity_type = 500;
  } else if (product === 'pre3') {
    price_ID = 'price_1Nj0POGo36tEddLKCpLUAnPw';
    mode = 'payment';
    line_items = [
      {
        price: price_ID,
        quantity: 1
      }
    ];
    quantity_type = 1000;
  } else if (product === 'pre4') {
    price_ID = 'price_1Nj0SXGo36tEddLK0NCfEDyZ';
    mode = 'payment';
    line_items = [
      {
        price: price_ID,
        quantity: 1
      }
    ];
    quantity_type = 2000;
  } else if (product === 'pre5') {
    price_ID = 'price_1Nj0TSGo36tEddLK8sXPtgHV';
    mode = 'payment';
    line_items = [
      {
        price: price_ID,
        quantity: 1
      }
    ];
    quantity_type = 5000;
  } else {
    return res.sendStatus(403);
  }

  const customer = await stripe.customers.create();

  const stripeCustomerId = customer.id;
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: line_items,
    mode: mode,
    success_url: `${DOMAIN}/success.html`,
    cancel_url: `${DOMAIN}/cancel.html`,
  });
  console.log(session);

  token = quantity_type.toString();

  const data = {
    payment_type: product,
    stripeCustomerId,
    status: quantity_type,
    userId: userId,
    token: token 
  };
  const response = await admin.firestore().collection('api_keys').doc().set(data, { merge: true });

  res.redirect(303, session.url);
});

export default router;
