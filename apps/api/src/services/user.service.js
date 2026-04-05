const { User, Booking, BookingAssign, Payment } = require("../models");
const { GoogleMap, Invoice } = require("../helpers");
const { Setting } = require("../models");
const moment = require("moment-timezone");

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  // if (updateBody.phone && (await User.isPhoneTaken(updateBody.phone, userId))) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Phone already taken');
  // }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const bookingTrack = async (pnr_no) => {
  try {
    const getData = await Booking.aggregate([
      {
        $match: {
          pnr_no,
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "pickupId",
          foreignField: "_id",
          as: "pickup_info",
        },
      },
      {
        $unwind: {
          path: "$pickup_info",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus_info",
        },
      },
      {
        $unwind: {
          path: "$bus_info",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "bookingassigns",
          let: {
            routeId: "$routeId",
            bus_dep_date: "$bus_depature_date",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$routeId", "$$routeId"],
                    },
                    {
                      $in: ["$trip_status", ["RIDING", "STARTED"]],
                    },
                    {
                      $in: [
                        {
                          $dateFromString: {
                            dateString: {
                              $dateToString: {
                                date: "$$bus_dep_date",
                                format: "%Y-%m-%d",
                                timezone: "Asia/Kolkata",
                              },
                            },
                          },
                        },
                        "$dates",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "drivers",
                localField: "driverId",
                foreignField: "_id",
                as: "driver_info",
              },
            },
            {
              $unwind: {
                path: "$driver_info",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "getBookingAssign",
        },
      },
      {
        $unwind: {
          path: "$getBookingAssign",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (getData.length > 0) {
      const data = getData[0];
      if (data.getBookingAssign) {
        const driverLocation =
          data.getBookingAssign.driver_info?.currentLocation;
        const assignLocation = data.getBookingAssign.location;

        return {
          angle: data.getBookingAssign.angle
            ? data.getBookingAssign.angle
            : "0",
          bus_model_no: data.bus_info ? data.bus_info.model_no : "",
          bus_reg_no: data.bus_info ? data.bus_info.reg_no : "",
          pickup_lat:
            data.pickup_info && data.pickup_info.location
              ? data.pickup_info.location.coordinates[1].toString()
              : "0.0",
          pickup_lng:
            data.pickup_info && data.pickup_info.location
              ? data.pickup_info.location.coordinates[0].toString()
              : "0.0",
          bus_lat: (driverLocation?.coordinates?.[1] > 0
            ? driverLocation.coordinates[1]
            : assignLocation?.coordinates?.[1] || 0.0
          ).toString(),
          bus_lng: (driverLocation?.coordinates?.[0] > 0
            ? driverLocation.coordinates[0]
            : assignLocation?.coordinates?.[0] || 0.0
          ).toString(),
        };
      } else {
        return {
          angle: "0",
          bus_model_no: "",
          bus_reg_no: "",
          pickup_lat: 0.0,
          pickup_lng: 0.0,
          bus_lat: 0.0,
          bus_lng: 0.0,
        };
      }
    }
  } catch (err) {
    console.log(err);
    return "err while :" + err;
  }
};

const invoiceGenerate = async (pnr_no, res) => {
  try {
    const generalSetting = await Setting.getgeneral();
    const company = generalSetting.general;
    const getData = await Booking.findOne({ pnr_no })
      .populate({
        path: "userId",
        select: "firstname lastname email phone places",
      })
      .populate({ path: "routeId", select: "title" })
      .populate({ path: "pickupId", select: "title" })
      .populate({ path: "dropoffId", select: "title" })
      .populate({ path: "payments", select: "method" })
      .populate({ path: "offerId" })
      .populate({ path: "passId" })
      .lean();

    if (getData) {
      const discount_amount = getData.offerId
        ? Math.round(
            (parseFloat(getData.final_total_fare) *
              parseInt(getData.offerId.discount)) /
              100,
          )
        : 0;

      const userDetails = {
        company: {
          ...company,
          light_logo: company.light_logo
            ? company.light_logo.startsWith("http")
              ? company.light_logo
              : `${process.env.BASE_URL}/${company.light_logo}`
            : "",
          logo: company.logo
            ? company.logo.startsWith("http")
              ? company.logo
              : `${process.env.BASE_URL}/${company.logo}`
            : "",
        },
        customer: {
          fullname: getData.userId.firstname + " " + getData.userId.lastname,
          phone: getData.userId.phone,
          email: getData.userId.email,
          address: getData.userId?.places?.home?.address || "",
        },
        route_name: getData.routeId.title,
        pickup_name: getData.pickupId.title,
        dropoff_name: getData.dropoffId.title,
        start_time: getData.start_time,
        start_date: getData.start_date,
        method: getData.payments.method,
        pnr_no: getData.pnr_no,
        booking_date: moment(getData.booking_date)
          .tz("Asia/Kolkata")
          .format("LLL"),
        discount: getData.discount,
        sub_total: getData.sub_total,
        tax_amount: getData.tax_amount,
        tax: getData.tax,
        final_total_fare: getData.final_total_fare,
        created_date: moment(getData.createdAt)
          .tz("Asia/Kolkata")
          .format("LLL"),
        isPass: getData.passId ? true : false,
        pass: getData.passId ? getData.passId : {},
        isOffer: getData.offerId ? true : false,
        offer: getData.offerId
          ? {
              code: getData.offerId.code,
              discount: getData.offerId.discount,
              discount_amount: discount_amount.toString(),
              final_total_after_discount: (
                parseFloat(getData.final_total_fare) - discount_amount
              ).toString(),
            }
          : {},
      };
      return await Invoice.generatePDF(userDetails, "invoice", res);
    }
    return false;
  } catch (err) {
    return "err while :" + err;
  }
};

const bookingHistory = async (userId, limit) => {
  try {
    const getpayments = await Payment.find({
      $and: [{ bookingId: { $ne: [] } }],
      userId,
      payment_status: { $in: ["Completed", "Cancelled"] },
    })
      .populate({
        path: "bookingId",
        populate: [
          { path: "offerId" },
          {
            path: "busId",
            select: "code name brand model_no chassis_no reg_no",
          },
          { path: "routeId", select: "title" },
          { path: "pickupId", select: "title" },
          { path: "dropoffId", select: "title" },
        ],
      })
      .populate({ path: "passId" })
      .limit(parseInt(limit))
      .sort({ _id: -1 })
      .lean();
    // return getpayments;
    return Payment.formattedBookingData(getpayments);
  } catch (err) {
    return "err while :" + err;
  }
};

const verifyOTPExists = async (_id, otp) => {
  return await User.exists({ _id, otp });
};

module.exports = {
  getUserById,
  updateUserById,
  bookingTrack,
  invoiceGenerate,
  bookingHistory,
  verifyOTPExists,
};
