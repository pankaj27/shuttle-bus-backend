const httpStatus = require("http-status");
const mongoose = require("mongoose");
const paymentGateway = require("../models/paymentGateway.model");
const { demoMode } = require("../../config/vars");
const { maskSecret } = require("../utils/masker");
const APIError = require("../utils/APIError");

const normalizePaymentGatewaySite = (site) => {
  const normalized = String(site || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (normalized === "razorpay") return "Razorpay";
  if (normalized === "paystack" || normalized === "pay stack") return "Paystack";
  if (normalized === "paymob") return "Paymob";
  if (normalized === "mercadopago" || normalized === "mercado pago") return "Mercadopago";
  if (normalized === "flutterwave") return "Flutterwave";
  return site;
};

const isTxnNotSupported = (err) => {
  const message = String(err?.message || "");
  return message.includes(
    "Transaction numbers are only allowed on a replica set member or mongos",
  );
};

/**
 *  update payment is enabled
 * @public
 */
exports.isEnabled = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.findOne({
      name: "is_enabled",
      value: "1",
    });

    if (getPaymentGateway) {
      res.status(httpStatus.OK);
      res.json({
        message: `Please disabled the payment gateway ${getPaymentGateway.site} first.`,
        status: false,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "",
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.aggregate([
      {
        $addFields: {
          siteCanonical: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $toLower: "$site" }, "razorpay"] },
                  then: "Razorpay",
                },
                {
                  case: { $eq: [{ $toLower: "$site" }, "paystack"] },
                  then: "Paystack",
                },
                {
                  case: { $eq: [{ $toLower: "$site" }, "paymob"] },
                  then: "Paymob",
                },
                {
                  case: { $eq: [{ $toLower: "$site" }, "mercadopago"] },
                  then: "Mercadopago",
                },
                {
                  case: { $eq: [{ $toLower: "$site" }, "flutterwave"] },
                  then: "Flutterwave",
                },
              ],
              default: "$site",
            },
          },
        },
      },
      {
        $group: {
          _id: "$siteCanonical",
          name: { $push: { id: "$_id", name: "$name", value: "$value" } }, // Collect the associated 'name' and 'value' fields for each site
          is_enabled: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$name", "is_enabled"] },
                    { $eq: ["$value", "1"] },
                  ],
                },
                "1",
                "0",
              ], // Check if 'name' is 'is_enabled' and 'value' is 1
            },
          },
        },
      },
      {
        $addFields: {
          site_slug: {
            $replaceAll: {
              input: { $toLower: "$_id" }, // Convert 'site' to lowercase
              find: " ",
              replacement: "_", // Replace spaces with underscores
            },
          },
        },
      },
      {
        $project: {
          _id: 1, // Include the site name as '_id'
          site_slug: 1, // Include the slug
          name: 1, // Include the keys array
          is_enabled: {
            $cond: {
              if: { $eq: ["$is_enabled", "1"] },
              then: true,
              else: false,
            },
          }, // Set 'is_enabled' to true if it's 1, otherwise false
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    // const getPaymentGateway = await paymentGateway.find({
    //   site: req.params.site,
    // });
    // const convertedObject = {};

    // getPaymentGateway.forEach((item) => {
    //   convertedObject[item.name] = item.value;
    // });
    if (demoMode) {
      getPaymentGateway.forEach((site) => {
        if (site.name) {
          site.name = site.name.map((item) => {
            if (item.name !== "is_enabled") {
              return { ...item, value: maskSecret(item.value) };
            }
            return item;
          });
        }
      });
    }

    res.status(httpStatus.OK);
    res.json({
      message: `payment setting fetched successfully.`,
      data: getPaymentGateway,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.update = async (req, res, next) => {
  if (demoMode) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: "Payment gateway updates are restricted in Demo Mode.",
      status: false,
    });
  }
  let { paymentName } = req.params;
  paymentName = normalizePaymentGatewaySite(paymentName);

  const execute = async () => {
    const escaped = String(paymentName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await paymentGateway.updateMany(
      { site: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { $set: { site: paymentName } },
    );

    if (req.body && Object.keys(req.body).length > 0) {
      const operations = Object.entries(req.body).map(([keyName, keyValue]) => ({
        updateOne: {
          filter: { site: paymentName, name: keyName },
          update: { $set: { value: keyValue } },
          upsert: true,
        },
      }));

      await paymentGateway.bulkWrite(operations);
    }
  };

  try {
    await execute();
    return res.status(httpStatus.OK).json({
      message: `Payment gateway ${paymentName} updated successfully.`,
      status: true,
    });
  } catch (error) {
    return next(new APIError({ message: error.message }));
  }
};
