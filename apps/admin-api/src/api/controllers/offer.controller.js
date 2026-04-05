const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const base64Img = require("base64-img");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Route = require("../models/route.model");
const Offer = require("../models/offer.model");
const Booking = require("../models/booking.model");
const Setting = require("../models/setting.model");
const RouteDetail = require("../models/routeDetail.model");
const {
  imageDelete,
  imageUpload,
  uploadLocal,
} = require("../services/uploaderService");
const faker = require("../helpers/faker");

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    res.status(httpStatus.OK);
    res.json({
      message: "Single offer successfully.",
      data: offer,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Update Status
 * @public
 */
exports.updateStatus = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.offerId, {
      status: req.body.status,
    });
    res.status(httpStatus.OK);
    res.json({
      message: "Offer status updated.",
      data: offer,
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      adminId,
      routeId,
      name,
      type,
      start_date,
      end_date,
      code,
      discount,
      picture,
      attempt,
      status,
      terms,
    } = req.body;
    const saveOffer = {
      adminId,
      routeId: routeId || null,
      name,
      start_date,
      end_date,
      code,
      discount,
      type,
      status,
      attempt,
      picture,
      terms,
    };

    const offer = await new Offer(saveOffer).save();
    return res.json({
      status: true,
      message: "offer create successfully",
      data: offer,
    });
  } catch (error) {
    return res.json({
      status: false,
      message: "could not create",
      data: error.message,
    });
  }
};

/**
 * Update existing routes
 * @public
 */

exports.update = async (req, res, next) => {
  try {
    const offerexists = await Offer.findById(req.params.offerId).exec();
    if (offerexists) {
      const objUpdate = {
        adminId: req.body.adminId,
        name: req.body.name,
        code: req.body.code,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        discount: req.body.discount,
        picture: req.body.picture,
        type: req.body.type,
        status: req.body.status,
        attempt: req.body.attempt,
        routeId: req.body.routeId != "" ? req.body.routeId : null,
      };

      const updateOffer = await Offer.findByIdAndUpdate(
        req.params.offerId,
        {
          $set: objUpdate,
        },
        {
          returnDocument: "after",
        },
      );
      if (updateOffer) {
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "offer updated successfully",
          data: updateOffer,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No offer found.",
      });
    }
  } catch (error) {
    console.log("error", error);
    return next(error);
  }
};

/**
 * Get bus list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.search
      ? {
          $or: [
            {
              name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              code: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              route_name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          is_deleted: false,
        }
      : { is_deleted: false };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    //    console.log('1212', sort);
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
    };

    const aggregateQuery = Offer.aggregate([
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: {
          path: "$route",
          preserveNullAndEmptyArrays: true, // Handle potential null values
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          adminId: 1,
          name: 1,
          code: 1,
          discount: 1,
          attempt: 1,
          start_date: 1, // moment.utc(item.start_date).format('MMM DD, YYYY'),
          end_date: 1, // moment.utc(item.end_date).format('MMM DD, YYYY'),
          type: {
            $cond: {
              if: { $eq: ["$type", true] },
              then: "route not applied",
              else: "route applied",
            },
          },
          route_name: { $ifNull: ["$route.title", "-"] },
          terms: 1,
          is_deleted: 1,
          picture: 1,
          status: 1,
          createdAt: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $match: {
          status:
            req.query.type == "all"
              ? { $in: [true, false] }
              : req.query.type === "active",
        },
      },
    ]);

    const result = await Offer.aggregatePaginate(aggregateQuery, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    if (await Offer.exists({ _id: req.params.offerId })) {
      if (
        await Booking.exists({
          offerId: new mongoose.Types.ObjectId(req.params.offerId),
        })
      ) {
        res.status(httpStatus.OK).json({
          status: true,
          message: "Offer already used in booking. can't be deleted.",
        });
      } else {
        const offerexists = await Offer.findOne({ _id: req.params.offerId });

        const deleteOffer = await Offer.updateOne(
          { _id: req.params.offerId },
          { is_deleted: true },
        );
        if (deleteOffer) {
          res.status(httpStatus.OK).json({
            status: true,
            message: "Offer deleted successfully.",
          });
        }
      }
    }
  } catch (err) {
    next(err);
  }
};
