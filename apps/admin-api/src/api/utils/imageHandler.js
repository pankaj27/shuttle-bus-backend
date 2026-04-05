const { v4: uuidv4 } = require("uuid");
const settingModel = require("../models/setting.model");
const {
  imageDelete,
  imageUpload,
  resizeUpload,
  uploadLocal,
  uploadCloudinary,
  deleteCloudinary,
  fileUpload,
} = require("../services/uploaderService");

/**
 * Handle image upload with support for Local, Spaces, and Cloudinary
 *
 * @param {File|string} newFile - File object or base64 string of the new picture
 * @param {string} existingPicture - Existing image URL (if any)
 *  @param {string} folderName - folderName
 * @param {Object} options - upload options
 * @param {boolean} [options.resize=false] - Whether to resize the image
 * @param {number} [options.width] - Resize width
 * @param {number} [options.height] - Resize height
 * @param {string} [options.filenamePrefix="file"] - Prefix for the file name
 * @param {string} [options.quality] - For cloudinary
 * @returns {Promise<string>} - URL of the uploaded picture
 */
const handleImageUpload = async (
  newFile,
  existingPicture,
  folderName,
  options = {},
) => {
  if (!newFile) return existingPicture;

  const {
    resize = false,
    width,
    height,
    filenamePrefix = "file",
    quality,
  } = options;

  // get storage config from DB
  const storageConfig = await settingModel.getStorage();

  // delete old image if it's a valid URL
  if (isValidURL(existingPicture)) {
    switch (storageConfig.name) {
      case "cloudinary":
        // pass the inner cloudinary config object to the delete helper
        await deleteCloudinary(storageConfig.cloudinary || {}, existingPicture);
        break;
      default:
        await imageDelete(existingPicture, folderName || "");
    }
  }

  const filename = `${filenamePrefix}-${uuidv4()}`;

  // Normalize incoming file to one of: { buffer, mimetype, name } or base64 string
  let buffer = null;
  let mimetype = null;
  let originalName = null;
  let base64String = null;

  // req.files (express-fileupload) provides object with .data Buffer
  if (Buffer.isBuffer(newFile)) {
    buffer = newFile;
  } else if (newFile && newFile.data && Buffer.isBuffer(newFile.data)) {
    buffer = newFile.data;
    mimetype = newFile.mimetype;
    originalName = newFile.name;
  } else if (typeof newFile === "string" && newFile.indexOf("base64") !== -1) {
    base64String = newFile;
  }

  // If we have a buffer and caller requested resize, pass raw base64 (no data: prefix)
  if (buffer && resize) {
    const base64Only = buffer.toString("base64");
    // resizeUpload expects raw base64 (without data:<type>;base64, prefix)
    const resized = await resizeUpload(true, base64Only, width, height);
    // resized is a Buffer
    buffer = Buffer.isBuffer(resized) ? resized : Buffer.from(resized);
    // ensure we have mimetype for later uploads
    mimetype = mimetype || "image/png";
  }

  // If no resize and we have buffer, prepare base64String for local or cloudinary if needed
  if (buffer && !base64String) {
    const inferredType = mimetype || "image/png";
    base64String = `data:${inferredType};base64,${buffer.toString("base64")}`;
  }

  switch (storageConfig.name || "local") {
    case "spaces": {
      // For spaces (S3/DigitalOcean), use imageUpload which accepts Buffer or base64
      if (buffer) return await imageUpload(buffer, filename, folderName);
      if (base64String)
        return await imageUpload(base64String, filename, folderName);
      // fallback: try file upload helper if full file object provided
      if (newFile && newFile.name)
        return await fileUpload(newFile, filename, folderName);
      throw new Error("Unsupported file format for spaces upload");
    }

    case "cloudinary": {
      // Validate cloudinary configuration before attempting upload
      const cfg = storageConfig.cloudinary || {};
      const hasCreds =
        (cfg.api_key && cfg.api_key.length) || process.env.CLOUDINARY_KEY;
      if (!cfg.cloud_name && !process.env.CLOUDINARY_NAME) {
        throw new Error("Cloudinary is not configured: missing cloud_name");
      }
      if (!hasCreds) {
        throw new Error(
          "Cloudinary is not configured: missing api_key or CLOUDINARY_KEY",
        );
      }
      if (
        !(cfg.api_secret && cfg.api_secret.length) &&
        !process.env.CLOUDINARY_SECRET
      ) {
        throw new Error(
          "Cloudinary is not configured: missing api_secret or CLOUDINARY_SECRET",
        );
      }

      // Cloudinary uploader accepts base64 or file object
      if (base64String)
        return await uploadCloudinary(
          cfg,
          base64String,
          folderName,
          height,
          width,
          quality,
        );
      if (buffer)
        return await uploadCloudinary(
          cfg,
          buffer,
          folderName,
          height,
          width,
          quality,
        );
      return await uploadCloudinary(
        cfg,
        newFile,
        folderName,
        height,
        width,
        quality,
      );
    }

    case "local":
    default:
      // local upload expects base64 string
      if (base64String) return await uploadLocal(base64String, folderName);
      if (buffer)
        return await uploadLocal(
          `data:${mimetype || "image/png"};base64,${buffer.toString("base64")}`,
          folderName,
        );
      // fallback: if an object with name/data exists, upload via fileUpload
      if (newFile && newFile.name)
        return await fileUpload(newFile, filename, folderName || "uploads");
      throw new Error("Unsupported file format for local upload");
  }
};

const isValidURL = (str) => {
  const regex =
    /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if (!regex.test(str)) {
    return false;
  }
  return true;
};

const handleImageDelete = async (fileUrl, folderName) => {
  if (!fileUrl) return;

  const storageConfig = await settingModel.getStorage();

  if (isValidURL(fileUrl)) {
    switch (storageConfig.name) {
      case "cloudinary":
        await deleteCloudinary(
          storageConfig.cloudinary || {},
          fileUrl,
          folderName,
        );
        break;
      case "spaces":
      case "s3":
        await imageDelete(fileUrl, folderName || "");
        break;
      default:
        // For local if it's a full URL, we might need to extract the path
        if (fileUrl.includes("/public/")) {
          const pathPart = fileUrl.split("/public/")[1];
          await deleteLocal(pathPart, "");
        }
    }
  } else {
    // If it's just a path/filename
    switch (storageConfig.name) {
      case "cloudinary":
        await deleteCloudinary(
          storageConfig.cloudinary || {},
          fileUrl,
          folderName,
        );
        break;
      case "spaces":
      case "s3":
        await imageDelete(fileUrl, folderName || "");
        break;
      case "local":
      default:
        await deleteLocal(fileUrl, folderName || "");
    }
  }
};

module.exports = {
  handleImageUpload,
  isValidURL,
  handleImageDelete,
};
