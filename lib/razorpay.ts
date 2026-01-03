import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.warn("WARNING: Razorpay environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing. Razorpay features will not work.");
}

export const razorpay = new Razorpay({
    key_id: key_id || "rzp_test_placeholder",
    key_secret: key_secret || "secret_placeholder",
});
