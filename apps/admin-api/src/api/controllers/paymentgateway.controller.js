const httpStatus = require("http-status");
const mongoose = require("mongoose");
const paymentGateway = require("../models/paymentGateway.model");
const { demoMode } = require("../../config/vars");
const { maskSecret } = require("../utils/masker");
const APIError = require("../utils/APIError");

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
        $group: {
          _id: "$site", // Group by the 'site' field
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
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    let { paymentName } = req.params;

    if (req.body && Object.keys(req.body).length > 0) {
      // Transform { key: 'val', secret: 'val' } into bulk operations
      console.log("paymentName : ", paymentName);
      const operations = Object.entries(req.body).map(
        ([keyName, keyValue]) => ({
          updateOne: {
            filter: {
              site: paymentName, // Use the site name (e.g., "Razorpay")
              name: keyName, // Use the key (e.g., "key" or "secret")
            },
            update: {
              $set: { value: keyValue },
            },
            upsert: true, // Creates the doc if it doesn't exist for this site
          },
        }),
      );

      await paymentGateway.bulkWrite(operations, { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(httpStatus.OK).json({
      message: `Payment gateway ${paymentName} updated successfully.`,
      status: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(new APIError(error)); // Use next() for error handling
  }
};
