/**
 * Masks an email address for demo purposes.
 * Example: admin@gmail.com -> adm***@gm***.com
 * @param {string} email
 * @returns {string}
 */
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  const maskString = (str) => {
    if (str.length <= 3) return str[0] + "***";
    return str.substring(0, 3) + "***";
  };
  return `${maskString(user)}@${maskString(domain)}`;
};

/**
 * Masks a phone number for demo purposes.
 * Example: +1234567890 -> +123****890
 * @param {string} phone
 * @returns {string}
 */
const maskPhone = (phone) => {
  if (!phone) return phone;
  const str = String(phone);
  if (str.length <= 3) return str.substring(0, 2) + "****";
  return str.substring(0, 3) + "****" + str.substring(str.length - 3);
};

/**
 * Masks sensitive strings like API keys or secrets.
 * @param {string} secret
 * @returns {string}
 */
const maskSecret = (secret) => {
  if (!secret) return "";
  return "XXXX-XXXX-XXXX-XXXX";
};

/**
 * Masks fields in an object or array of objects based on DEMO_MODE.
 * @param {object|array} data
 * @param {boolean} isDemo
 * @param {array} fieldsToMask
 */
const applyMasking = (data, isDemo, fieldsToMask = ["email", "phone"]) => {
  if (!isDemo || !data) return data;

  const maskItem = (item) => {
    const newItem = { ...item };
    fieldsToMask.forEach((field) => {
      if (newItem[field]) {
        if (field === "email") newItem[field] = maskEmail(newItem[field]);
        else if (field === "phone") newItem[field] = maskPhone(newItem[field]);
        else newItem[field] = maskSecret(newItem[field]);
      }
    });
    return newItem;
  };

  if (Array.isArray(data)) {
    return data.map((item) => maskItem(item));
  }
  return maskItem(data);
};

module.exports = {
  maskEmail,
  maskPhone,
  maskSecret,
  applyMasking,
};
