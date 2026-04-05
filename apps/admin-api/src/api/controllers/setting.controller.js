const httpStatus = require("http-status");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const Setting = require("../models/setting.model");
const s3 = require("../../config/s3");
const {
  fileUpload,
  imageDelete,
  uploadLocal,
} = require("../services/uploaderService");
const { getFirstLetters } = require("../helpers/validate");
const { demoMode } = require("../../config/vars");
const { maskSecret } = require("../utils/masker");
const APIError = require("../utils/APIError");

exports.publicData = async (req, res) => {
  try {
    const settings = await Setting.findOne(
      {},
      "terms privacypolicy deleteaccount",
    ).sort({ _id: -1 });

    res.status(httpStatus.OK);
    res.json({
      code: 200,
      data: settings,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get application settings
 * @public
 */
exports.fetch = async (req, res) => {
  try {
    const settings = await Setting.findOne({}).sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      appName: settings.general.name,
      appShortName: getFirstLetters(settings.general.name),
      appLogo: settings.general.logo,
      appEmail: settings.general.email,
      appAddress: settings.general.address,
      appPhone: settings.general.phone,
      defaultCountry: settings.general.default_country,
      defaultCurrency: settings.general.default_currency,
      timezone: settings.general.timezone,
      googleKey: demoMode
        ? maskSecret(settings.general.google_key)
        : settings.general.google_key,
      dateFormat: settings.general.date_format,
      timeFormat: settings.general.time_format,
      maxDistance: settings.general.max_distance,
      prebookingTime: settings.general.prebooking_time,
      demoMode,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get application settings
 * @public
 */
exports.get = async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const settings = await Setting.findOne({}).lean();

    if (!settings || !settings[type]) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "Settings not found",
        status: false,
      });
    }

    let data = settings[type];

    // Mask sensitive data if in Demo Mode
    if (demoMode) {
      if (type === "smtp") {
        data.password = maskSecret(data.password);
        data.host = "smtp.demo-provider.com";
        data.username = "demo-user";
      } else if (type === "notifications") {
        if (data.firebase_key)
          data.firebase_key = maskSecret(data.firebase_key);
        if (data.firebase_database_url)
          data.firebase_database_url = "https://demo-project.firebaseio.com";
        if (data.firebase_credential) data.firebase_credential = {}; // Redact as object
        if (data.apple_key_id)
          data.apple_key_id = maskSecret(data.apple_key_id);
        if (data.apple_team_id)
          data.apple_team_id = maskSecret(data.apple_team_id);
      } else if (type === "storage" || type === "s3") {
        // Deep mask any field containing sensitive keywords
        const sensitveKeys = [
          "access_key",
          "secret_key",
          "api_key",
          "api_secret",
          "password",
          "key",
          "secret",
        ];
        const maskDeep = (obj) => {
          if (!obj || typeof obj !== "object") return;
          Object.keys(obj).forEach((k) => {
            if (sensitveKeys.some((sk) => k.toLowerCase().includes(sk))) {
              if (typeof obj[k] === "string" && obj[k])
                obj[k] = maskSecret(obj[k]);
            }
            if (obj[k] && typeof obj[k] === "object") maskDeep(obj[k]);
          });
        };
        maskDeep(data);

        // Specific overrides for storage
        if (data.spaces && type === "storage") {
          data.spaces.access_key = maskSecret(data.spaces.access_key);
          data.spaces.secret_key = maskSecret(data.spaces.secret_key);
          data.spaces.bucket = maskSecret(data.spaces.bucket);
          data.spaces.region = maskSecret(data.spaces.region);
          data.spaces.endpoint = maskSecret(data.spaces.endpoint);

          data.cloudinary.cloud_name = maskSecret(data.cloudinary.cloud_name);
          data.cloudinary.api_key = maskSecret(data.cloudinary.api_key);
          data.cloudinary.api_secret = maskSecret(data.cloudinary.api_secret);
        }
      } else if (type === "sms") {
        if (data.msg91 && data.msg91.key)
          data.msg91.key = maskSecret(data.msg91.key);
        if (data.twilio) {
          if (data.twilio.sid) data.twilio.sid = maskSecret(data.twilio.sid);
          if (data.twilio.token)
            data.twilio.token = maskSecret(data.twilio.token);
        }
      } else if (type === "general") {
        if (data.google_key) data.google_key = maskSecret(data.google_key);
      }
    }

    res.status(httpStatus.OK).json({
      msg: "Setting fetched successfully.",
      data,
      code: httpStatus.OK,
    });
  } catch (error) {
    console.error(error);
    throw new APIError(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.updateNotificationSetting = async (req, res, next) => {
  try {
    if (demoMode) {
      return res.status(httpStatus.FORBIDDEN).json({
        message: "Action restricted in Demo Mode.",
        status: false,
        code: httpStatus.FORBIDDEN,
      });
    }
    const {
      type,
      apple_key_id,
      apple_team_id,
      firebase_database_url,
      otp_validation_via,
    } = req.body;

    const settingObject = {
      notifications: {
        otp_validation_via,
        firebase_database_url,
        apple_key_id,
        apple_team_id,
      },
    };
    const FolderName = process.env.S3_BUCKET_SETTINGS;
    const settingexists = await Setting.findById(req.params.settingId).exec();
    let appleFile = req.files.apple_key;
    if (appleFile) {
      let uploadApplePath = path.join(
        __dirname,
        "../../api/services/files",
        appleFile.name,
      );

      if (settingexists && settingexists.apple_key != "") {
        // await imageDelete(settingexists.notifications.apple_key, FolderName);
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      } else {
        /** settingObject.notifications.apple_key = await fileUpload(
				req.files.apple_key,
				uuidv4(),
				FolderName
			  ); **/
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      }
    }

    let firebaseFile = req.files.firebase_key;
    if (firebaseFile) {
      const firebaseRawdata = firebaseFile.data.toString("utf-8");

      // Parse the JSON
      settingObject.notifications.firebase_credential =
        JSON.parse(firebaseRawdata);
    }

    await Setting.findByIdAndUpdate(
      req.params.settingId,
      {
        $set: settingObject,
      },
      {
        new: true,
      },
    );
    res.json({
      message: "notifications updated successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { type } = req.params; // e.g. 'general' or 'smtp'
    const data = req.body; // object containing updated fields

    if (demoMode) {
      const sensitiveTypes = [
        "general",
        "smtp",
        "notifications",
        "payment_gateway",
        "storage",
      ];
      if (sensitiveTypes.includes(type)) {
        return res.status(httpStatus.FORBIDDEN).json({
          msg: "Action restricted in Demo Mode.",
          code: httpStatus.FORBIDDEN,
          status: false,
        });
      }
    }
    //const existingAdmin = await Setting.findOne({}, { [type]: 1 }).lean();

    console.log("data", data);
    if (type === "terms" || type === "privacypolicy") {
      const updated = await Setting.findOneAndUpdate(
        {}, // update the first (and usually only) settings document
        { [type]: data[type] }, // dynamically set the field (e.g. { general: {...} })
        { new: true, upsert: true }, // return updated doc and create if not exists
      );
      res.status(200).json({
        msg: `${type} setting updated successfully.`,
        data: updated[type],
        code: 200,
      });
    } else {
      const updated = await Setting.findOneAndUpdate(
        {}, // update the first (and usually only) settings document
        { [type]: data }, // dynamically set the field (e.g. { general: {...} })
        { new: true, upsert: true }, // return updated doc and create if not exists
      );
      res.status(200).json({
        msg: `${type} setting updated successfully.`,
        data: updated[type],
        code: 200,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      msg: "Something went wrong.",
      code: 400,
    });
  }
};
