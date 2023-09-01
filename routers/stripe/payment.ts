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
          success_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel"
      });
      return session;
  }catch (e){
    console.error((e as Error).message);
      return e;
  }
};

const calculateTokensBasedOnPlan = (plan:number) => {
  switch (plan) {
    case 19:
      return 100;
    case 79:
      return 500;
    case 149:
      return 1000;
    case 279:
      return 2000;
    case 599:
      return 5000;
    default:
      return 0;
  }
};

const giveTokensToUser = async (email:string, tokens:number) => {
  try {
    const userSnapshot = await admin.database().ref("users").orderByChild("email").equalTo(email).once("value");
    const userUid = Object.keys(userSnapshot.val())[0];
    const userTokens = userSnapshot.child(`${userUid}/tokens`).val();
    const updatedTokens = userTokens + tokens;

    await admin.database().ref("users").child(userUid).update({
      tokens: updatedTokens,
    });

    console.log(`Tokens added to user ${email}. New token balance: ${updatedTokens}`);
  } catch (error) {
    console.error("Error giving tokens to user:", error);
  }
};

router.post('/subscribe', async (req:Request, res:Response) => {
  try {
    const { plan, customerId } = req.body;
    let planId: string | null = null;
    if(plan == 19) planId = planOne;
    else if(plan == 79) planId = planTwo;
    else if(plan == 149) planId = planThree;
    else if(plan == 279) planId = planFour;
    else if(plan == 599) planId = planFive;

    if (planId === null) {
      throw new Error('Invalid plan');
    }

    const session = await stripeSession(planId);

    const user = await admin.auth().getUser(customerId);

    await admin.database().ref("users").child(user.uid).update({
      subscription: {
        sessionId: session.id
      }
    });
    console.log(session)
    return res.json({session})

  } catch (error) {
    console.error((error as Error).message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post("/payment-success", async (req: Request, res: Response) => {
  const { sessionId, firebaseId } = req.body;

  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const subscriptionId = session.subscription;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Calculate the tokens based on the subscription plan
      const planId = subscription.plan.id;
      const tokensToAdd = calculateTokensBasedOnPlan(parseInt(planId)); // Parse planId to an integer

      // Retrieve the user
      const user = await admin.auth().getUser(firebaseId);

      // Update the user's token balance
      if (user.email) {
        await giveTokensToUser(user.email, tokensToAdd);
      }

      // Update the user's subscription and token balance in the database
      await admin.database().ref("users").child(user.uid).update({
        tokens: tokensToAdd,
      });

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
