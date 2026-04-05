const mongoose = require("mongoose");
const Role = require("../models/role.model");
const Admin = require("../models/admin.model");
const AdminRole = require("../models/adminRole.model");
const Setting = require("../models/setting.model");
const PaymentGateway = require("../models/paymentGateway.model");
const Permission = require("../models/permission.model");
const Country = require("../models/country.model");
const Currency = require("../models/currency.model");
const Language = require("../models/language.model");

/**
 * Seed Core Dependencies (Roles, Admin User, and Default Settings)
 */
const seedCore = async () => {
  let count = 0;

  console.log("Starting core seeder...");

  // 1. Seed Permissions
  const permissionsToSeed = require("./permissions.json");

  let insertedPermissionIds = [];

  for (const permData of permissionsToSeed) {
    let permission = await Permission.findOne({ slug: permData.slug });
    if (!permission) {
      permission = await Permission.create(permData);
      console.log(`✅ Permission created: ${permData.name}`);
      count++;
    } else {
      console.log(`ℹ️ Permission already exists: ${permData.name}`);
    }
    insertedPermissionIds.push(permission._id);
  }

  // 2. Seed Roles
  const rolesToSeed = require("./roles.json");

  for (const roleData of rolesToSeed) {
    let role = await Role.findOne({ slug: roleData.slug });

    // Map permission slugs to actual ObjectIDs
    const permissionIds = [];
    if (roleData.permissionSlugs) {
      for (const slug of roleData.permissionSlugs) {
        const perm = await Permission.findOne({ slug });
        if (perm) permissionIds.push(perm._id);
      }
    }

    const finalRoleData = {
      name: roleData.name,
      slug: roleData.slug,
      permissions: permissionIds,
    };

    if (!role) {
      role = await Role.create(finalRoleData);
      console.log(`✅ Role created: ${roleData.name}`);
      count++;
    } else {
      // Update permissions if role already exists to keep it in sync with JSON
      role.permissions = permissionIds;
      await role.save();
      console.log(`ℹ️ Role updated/synced: ${roleData.name}`);
    }
  }

  // 3. Seed Admin Users
  const adminsToSeed = require("./admins.json");

  for (const adminData of adminsToSeed) {
    let adminUser = await Admin.findOne({ email: adminData.email });

    // Find matching role
    const roleForAdmin = await Role.findOne({ slug: adminData.role });
    if (!roleForAdmin) {
      console.error(
        `❌ Role not found for admin: ${adminData.email} (${adminData.role})`,
      );
      continue;
    }

    const finalAdminData = {
      ...adminData,
      roleId: roleForAdmin._id,
    };

    if (!adminUser) {
      adminUser = await Admin.create(finalAdminData);
      console.log(`✅ Admin User created: ${adminData.email}`);
      count++;

      // Seed Admin Role pivot map
      await AdminRole.create({
        adminId: adminUser._id,
        roleId: roleForAdmin._id,
      });
      console.log(`✅ Admin Role mapping created for ${adminData.email}`);
    } else {
      console.log(`ℹ️ Admin User already exists: ${adminUser.email}`);
      // Update details and roles
      adminUser.details = adminData.details;
      adminUser.roleId = roleForAdmin._id;
      adminUser.role = roleForAdmin.slug;
      await adminUser.save();
    }
  }

  // 4. Seed Default Application Settings
  const defaultSettingData = require("./settings.json");

  const existingSetting = await Setting.findOne();
  if (!existingSetting) {
    await Setting.create(defaultSettingData);
    console.log(`✅ Default Application Settings created`);
    count++;
  } else {
    console.log(`ℹ️ Settings already exist`);
  }

  // 5. Seed Payment Gateways
  const gatewaysToSeed = require("./payment_gateways.json");

  for (const gwData of gatewaysToSeed) {
    let gateway = await PaymentGateway.findOne({
      site: gwData.site,
      name: gwData.name,
    });
    if (!gateway) {
      await PaymentGateway.create(gwData);
      console.log(
        `✅ Payment Gateway created: ${gwData.site} - ${gwData.name}`,
      );
      count++;
    } else {
      console.log(
        `ℹ️ Payment Gateway already exists: ${gwData.site} - ${gwData.name}`,
      );
    }
  }

  // 6. Seed Utilities (Country, Currency, Default Language)
  const countriesToSeed = require("./countries.json");
  for (const cData of countriesToSeed) {
    let country = await Country.findOne({
      phone_code: cData.phone_code,
    });
    if (!country) {
      await Country.create(cData);
      console.log(`✅ Country created: ${cData.name}`);
      count++;
    }
  }

  const currenciesToSeed = require("./currencies.json");
  for (const currData of currenciesToSeed) {
    let currency = await Currency.findOne({ code: currData.code });
    if (!currency) {
      await Currency.create(currData);
      console.log(`✅ Currency created: ${currData.name}`);
      count++;
    }
  }

  const languagesToSeed = require("./languages.json");
  for (const lData of languagesToSeed) {
    let language = await Language.findOne({ code: lData.code });
    if (!language) {
      const country = await Country.findOne({
        short_name: lData.country_short_name,
      });
      if (country) {
        lData.countryId = country._id;
        delete lData.country_short_name;
        await Language.create(lData);
        console.log(`✅ Language created: ${lData.label}`);
        count++;
      } else {
        console.error(
          `❌ Country not found for language: ${lData.label} (${lData.country_short_name})`,
        );
      }
    }
  }

  return { count };
};

module.exports = { seedCore };
