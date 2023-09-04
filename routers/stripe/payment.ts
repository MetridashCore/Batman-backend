import { Router, Request, Response } from "express";
import stripe from "../../services/stripe";
import admin from "./../../firebase";

const router = Router();

const [planOne, planTwo, planThree, planFour, planFive] = [
  'price_1NiyeaGo36tEddLKI8NHcixv',
  'price_1NiywxGo36tEddLKhkEG01l5',
  'price_1Nj0POGo36tEddLKCpLUAnPw',
  'price_1Nj0SXGo36tEddLK0NCfEDyZ',
  'price_1Nj0TSGo36tEddLK8sXPtgHV'
];

const stripeSession = async(plan:string) => {
  try {
      const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
              {
                  price: plan,
                  quantity: 1
              },
          ],
          success_url: "http://localhost:3000/stripe/success",
          cancel_url: "http://localhost:3000/stripe/cancel",
      });
      return session;
  }catch (e){
    console.error((e as Error).message);
      return e;
  }
};

const calculateTokensBasedOnPlan = (plan:number) => {
  switch (plan) {
    case 1900:
      return 100;
    case 7900:
      return 500;
    case 14900:
      return 1000;
    case 27900:
      return 2000;
    case 59900:
      return 5000;
    default:
      return 0;
  }
};

router.post('/subscribe', async (req:Request, res:Response) => {
  try {
    const { plan, customerId } = req.body;
    let planId: string | null = null;
    if(plan == 19) {
      planId = planOne;
    }else if(plan == 79){
      planId = planTwo;
    } else if(plan == 149) {
      planId = planThree;
    }else if(plan == 279){
      planId = planFour;
    }else if(plan == 599){
      planId = planFive;
    }

    if (planId === null) {
      throw new Error('Invalid plan');
    }
    const session = await stripeSession(planId);

    const user = await admin.auth().getUser(customerId);
    const db = admin.firestore();
    const collectionName = 'users';
    const firestoreRoute = `/${collectionName}/${user.uid}`;
    
    await db.doc(firestoreRoute).update({
      'subscription.sessionId': session.id,
    });
    
    console.log(session);

    return res.json({ session });
  } catch (error) {
    console.error((error as Error).message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.post("/success", async (req: Request, res: Response) => {
  const { sessionId, firebaseId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const tokensToAdd = calculateTokensBasedOnPlan(session.amount_total); 
      const user = await admin.auth().getUser(firebaseId);
      const db = admin.firestore();
      const collectionName = 'users';
      const firestoreRoute = `/${collectionName}/${user.uid}`;

      await db.runTransaction(async (transaction) => {
        const documentRef = db.doc(firestoreRoute);
        const documentSnapshot = await transaction.get(documentRef);

        if (!documentSnapshot.exists) {
          throw new Error("Document does not exist");
        }

        const currentTokens = documentSnapshot.get("tokens") || 0;
        console.log(currentTokens)


        const newTokens = currentTokens + tokensToAdd;
        transaction.update(documentRef, { tokens: newTokens });
      });

      console.log(`Tokens added successfully in document: ${firestoreRoute}`);
      return res.json({ message: "Payment successful" });
    } else {
      return res.json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
