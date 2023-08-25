import { Router, Request, Response } from "express";
import stripe from "../../services/stripe";
import { generateApiKey } from "generate-api-key";
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



router.get('/api', async (req: Request, res: Response) => {
  const { api_key } = req.query;
  if (!api_key) { return res.sendStatus(403); }
  let paid_status: boolean = false;
  const doc = await admin.firestore().collection('api_keys').doc(api_key as string).get();
  if (!doc.exists) {
    res.status(403).send({ 'status': "API Key is invalid" });
  } else {
    const { status, type: keyType, stripeCustomerId } = doc.data()!;
    if (status === 'subscription') {
      paid_status = true;
      const customer = await stripe.customers.retrieve(
        stripeCustomerId,
        { expand: ['subscriptions'] }
      );
      console.log(customer);

      let subscriptionId = customer?.subscriptions?.data?.[0]?.id;
      console.log(subscriptionId);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId!);
      const itemId = subscription?.items?.data[0].id;

      const record = stripe.subscriptionItems.createUsageRecord(
        itemId, {
        quantity: 1,
        timestamp: 'now',
        action: 'increment'
      }
      );
      console.log('record created');
    } else if (status > 0) {
      paid_status = true;
      const data = {
        status: status - 1
      };
      const response = await admin.firestore().collection('api_keys').doc(api_key as string).set(data, { merge: true });
    }
  }
  if (paid_status) {
    res.status(200).send({ "message": "You can do it! I believe in you! Don't give up yet!" });
  } else {
    res.sendStatus(403);
  }
});

router.get('/check_status', async (req: Request, res: Response) => {
  const { api_key } = req.query;
  const doc = await admin.firestore().collection('api_keys').doc(api_key as string).get();
  if (!doc.exists) {
    res.status(400).send({ 'status': "API Key does not exist" });
  } else {
    const { status } = doc.data() ?? {};
    res.status(200).send({ 'status': status });
  }
});

router.get('/delete', async (req: Request, res: Response) => {
  const { api_key } = req.query;
  const doc = await admin.firestore().collection('api_keys').doc(api_key as string).get();
  if (!doc.exists) {
    res.status(400).send({ 'status': "API Key does not exist" });
  } else {
    const { stripeCustomerId } = doc.data() ?? {};
    try {
      const customer = await stripe.customers.retrieve(
        stripeCustomerId,
        { expand: ['subscriptions'] }
      );
      console.log(customer);
      let subscriptionId = customer?.subscriptions?.data?.[0]?.id;
      stripe.subscriptions.del(subscriptionId);

      const data = {
        status: null
      };
      const response = await admin.firestore().collection('api_keys').doc(api_key as string).set(data, { merge: true });
    } catch (err) {
      return res.sendStatus(500);
    }
    res.sendStatus(200);
  }
});

router.post('/create-checkout-session/:product', async (req: Request, res: Response) => {
  const { product } = req.params;
  const userId = req.user?.uid;
  let mode: string, price_ID: string, line_items: any[], quantity_type: any;

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

  const newAPIKey = generateApiKey();
  const customer = await stripe.customers.create({
    metadata: {
      APIkey: newAPIKey,
      userId: userId 
    }
  });

  const stripeCustomerId = customer.id;
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    metadata: {
      APIkey: newAPIKey,
      payment_type: product
    },
    line_items: line_items,
    mode: mode,
    success_url: `${DOMAIN}/success.html?api_key=${newAPIKey}`,
    cancel_url: `${DOMAIN}/cancel.html`,
  });
  console.log(session);


  const data = {
    APIkey: newAPIKey,
    payment_type: product,
    stripeCustomerId,
    status: quantity_type,
    userId: userId 
  };
  const response = await admin.firestore().collection('api_keys').doc(newAPIKey as string).set(data, { merge: true });

  res.redirect(303, session.url);
});

router.post('/stripe_webhook', (req: Request, res: Response) => {

});



export default router;
