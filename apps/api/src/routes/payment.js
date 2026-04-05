const express = require("express");

const { authenticate } = require("../middleware/authenticate");

const paymentController = require("../controllers/payment");

const router = express.Router();

router.get("/pay", authenticate, paymentController.pay);
router.post("/processed", paymentController.processed);
router.get("/verify", paymentController.verify);
router.get("/callback", paymentController.callback);
router.get("/flutterwave-callback", paymentController.flutterwaveCallback);
router.post("/paystack-webhook", paymentController.paystackWebhook);
router.post("/razorpay-webhook", paymentController.razorpayWebhook);
module.exports = router;
