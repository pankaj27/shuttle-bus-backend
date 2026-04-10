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
    const notifications = getSetting?.notifications || null;
    const firebase_database_url = notifications?.firebase_database_url || "";
    let firebase_credential = notifications?.firebase_credential || null;

    if (typeof firebase_credential === "string" && firebase_credential.trim()) {
      try {
        firebase_credential = JSON.parse(firebase_credential);
      } catch (e) {
        firebase_credential = null;
      }
    }

    if (
      firebase_credential &&
      typeof firebase_credential.private_key === "string" &&
      firebase_credential.private_key.includes("\\n")
    ) {
      firebase_credential.private_key = firebase_credential.private_key.replace(
        /\\n/g,
        "\n",
      );
    }

    const normalizedCredential =
      firebase_credential && typeof firebase_credential === "object"
        ? {
            projectId:
              firebase_credential.projectId || firebase_credential.project_id,
            clientEmail:
              firebase_credential.clientEmail || firebase_credential.client_email,
            privateKey:
              firebase_credential.privateKey || firebase_credential.private_key,
          }
        : null;

    const hasValidCredential =
      normalizedCredential &&
      typeof normalizedCredential.projectId === "string" &&
      normalizedCredential.projectId &&
      typeof normalizedCredential.clientEmail === "string" &&
      normalizedCredential.clientEmail &&
      typeof normalizedCredential.privateKey === "string" &&
      normalizedCredential.privateKey;

    console.log(
      "Initializing Firebase with Project ID:",
      hasValidCredential ? normalizedCredential.projectId : "UNDEFINED",
    );
    // console.log("Database URL:", firebase_database_url);

    if (!hasValidCredential) return;

    const appOptions = {
      credential: admin.credential.cert(normalizedCredential),
    };

    if (firebase_database_url) {
      appOptions.databaseURL = firebase_database_url;
    }

    admin.initializeApp(appOptions);
    initializedApp = admin;
    //console.log("Firebase Admin SDK initialized successfully!");
  } catch (err) {
    console.error("Error initializing Firebase:", err);
  }
};

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
