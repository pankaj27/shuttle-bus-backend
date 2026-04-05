const httpStatus = require("http-status");
const { omit } = require("lodash");
const { nanoid } = require("nanoid");
const mongoose = require("mongoose");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const firebaseUser = require("../services/firebaseUser");
const { notificationQueue } = require("../services/queueService");
const userNotification = require("../models/userNotification.model");

/**
 * Create recharge amount
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { userId, amount, type, reason, note } = req.body;
    //type = 0 credit 1 debit
    const adminId = req.user._id;
    if (await User.exists({ _id: new mongoose.Types.ObjectId(userId) })) {
      const getWallet = await Wallet.findOne({
        users: new mongoose.Types.ObjectId(userId),
      }).lean();
      if (getWallet) {
        const payment = new Payment({
          orderId: "order_" + nanoid(10),
          walletId: getWallet._id,
          userId: new mongoose.Types.ObjectId(userId),
          amount: parseFloat(amount),
          payment_type: reason === "Refund" ? "refund" : "wallet",
          payment_status: reason === "Refund" ? "Refunded" : "Completed",
          title: reason,
          type: type,
          note: note,
          method: "wallet",
          adminId,
        });
        const persistedPayment = await payment.save();
        if (persistedPayment) {
          const update = {
            amount:
              type == "0"
                ? getWallet.amount + parseFloat(amount)
                : getWallet.amount - parseFloat(amount),
          };
          const updateWallet = await Wallet.findOneAndUpdate(
            { users: new mongoose.Types.ObjectId(getWallet.users) },
            update,
            { new: true },
          );
          if (updateWallet) {
            const getUser = await User.findById(userId).select(
              "firstname lastname device_token device_type",
            );

            if (getUser && getUser.device_token) {
              let operation = type == 0 ? "Added" : "Debited";
              if (reason === "Refund" && type == 0) operation = "Refunded";

              const title = `Wallet ${operation} Successful`;
              const content = `Hey ${getUser.firstname} ${getUser.lastname}, Amount ${DEFAULT_CURRENCY}${amount} has been ${operation.toLowerCase()} in your wallet. Your new balance is ${DEFAULT_CURRENCY}${updateWallet.amount}`;

              // Add to BullMQ for background processing
              await notificationQueue.add("notifications", {
                type: "single",
                payload: {
                  token: getUser.device_token,
                  title: title,
                  body: content,
                  picture: "",
                },
              });

              userNotification.create(
                "wallet",
                title,
                content,
                userId,
                adminId,
                {},
              );
            }
            res.status(httpStatus.CREATED);
            res.json({
              message: `Amount ${type == 0 ? "Added" : "Debited"} successfully.`,
              data: {},
              status: true,
            });
          }
        }
      }
    }
  } catch (error) {
    next(error);
  }
};
