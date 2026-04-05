const admin = require("firebase-admin");
const Setting = require("../models/setting.model");

let initializedApp = null;
const firebaseAdmin = async () => {
  try {
    if (admin.apps.length > 0) {
      initializedApp = admin;
      return;
    }

    const getSetting = await Setting.findOne({}, "notifications");
    const firebase_database_url =
      getSetting.notifications.firebase_database_url;
    const firebase_credential = getSetting.notifications.firebase_credential;

    console.log(
      "Initializing Firebase with Project ID:",
      firebase_credential ? firebase_credential.project_id : "UNDEFINED",
    );
    // console.log("Database URL:", firebase_database_url);

    admin.initializeApp({
      credential: firebase_credential
        ? admin.credential.cert(firebase_credential)
        : "",
      databaseURL: firebase_database_url ? firebase_database_url : "",
    });
    initializedApp = admin;
    //console.log("Firebase Admin SDK initialized successfully!");
  } catch (err) {
    console.error("Error initializing Firebase:", err);
  }
};

firebaseAdmin();

const firebaseUser = {};

firebaseUser.sendMulticastNotification = async function (payload) {
  try {
    if (!initializedApp) {
      console.log("Firebase app not initialized, attempting to initialize...");
      await firebaseAdmin();
      if (!initializedApp)
        throw new Error("Firebase Admin SDK failed to initialize.");
    }

    console.log(`Sending multicast to ${payload.tokens.length} tokens`);

    if (!payload.tokens || payload.tokens.length === 0) {
      console.log("No tokens provided for multicast.");
      return { successCount: 0, failureCount: 0 };
    }

    const info_popup = {
      heading: payload.title,
      body: payload.body,
      imgurl: payload.picture,
    };
    const message = {
      tokens: payload.tokens,
      data: {
        title: payload.title,
        message: payload.body,
        info_popup: JSON.stringify(info_popup),
      },
    };

    return await initializedApp.messaging().sendEachForMulticast(message);
  } catch (err) {
    console.error("Error sending multicast notification:", err);
    throw err; // Re-throw to let the worker know it failed
  }
};

firebaseUser.sendSingleMessage = async function (payload) {
  try {
    if (!initializedApp) {
      console.log("Firebase app not initialized, attempting to initialize...");
      await firebaseAdmin();
      if (!initializedApp)
        throw new Error("Firebase Admin SDK failed to initialize.");
    }

    const info_popup = {
      heading: payload.title,
      body: payload.body,
      imgurl: payload.picture,
    };
    const message = {
      token: payload.token,
      data: {
        title: payload.title,
        message: payload.body,
        info_popup: JSON.stringify(info_popup),
      },
    };

    return await initializedApp.messaging().send(message);
  } catch (err) {
    console.error("Error sending single message:", err);
    throw err; // Re-throw to let the worker know it failed
  }
};

module.exports = firebaseUser;
