import Razorpay from "razorpay";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
}

export const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

export { KEY_ID as RAZORPAY_KEY_ID, KEY_SECRET as RAZORPAY_KEY_SECRET };