/**
 * Seeders Index
 * Central file to manage all seeders
 */

const mongoose = require("mongoose");
const { seedCore } = require("./core.seeder");

// Load environment variables
require("dotenv-safe").config({
  allowEmptyValues: true,
});

const { MONGO_URI } = process.env;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully\n");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("\n✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
  }
};

/**
 * Run all seeders
 */
const runAllSeeders = async () => {
  try {
    console.log("🌱 Starting all seeders...\n");
    console.log("=".repeat(50));

    await connectDB();

    // Run Core Seeder
    console.log("\n📦 Seeding Core Dependencies (Admins & Settings)...");
    const coreResult = await seedCore();
    console.log(`✅ Core Entities: ${coreResult.count} entities seeded`);

    // Add more seeders here as needed
    // Example:
    // console.log('\n📱 Seeding SMS Templates...');
    // const smsTemplateResult = await seedSmsTemplates();
    // console.log(`✅ SMS Templates: ${smsTemplateResult.count} templates seeded`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 All seeders completed successfully!");

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeder error:", error);
    await disconnectDB();
    process.exit(1);
  }
};

/**
 * Run specific seeder
 */
const runSeeder = async (seederName) => {
  try {
    console.log(`🌱 Starting ${seederName} seeder...\n`);

    await connectDB();

    let result;

    switch (seederName) {
      case "core":
        result = await seedCore();
        console.log(
          `✅ Successfully seeded ${result.count} core application entities`,
        );
        break;

      default:
        console.error(`❌ Unknown seeder: ${seederName}`);
        console.log("\nAvailable seeders:");
        console.log("  - core");
        await disconnectDB();
        process.exit(1);
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeder error:", error);
    await disconnectDB();
    process.exit(1);
  }
};

/**
 * CLI Handler
 */
const handleCLI = () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments, run all seeders
    runAllSeeders();
  } else if (args[0] === "--help" || args[0] === "-h") {
    // Show help
    console.log("\n📚 Seeder Usage:");
    console.log("=".repeat(50));
    console.log("\nRun all seeders:");
    console.log("  npm run seed");
    console.log("  node src/api/seeders/index.js");
    console.log("\nRun specific seeder:");
    console.log("  npm run seed:core");
    console.log("  node src/api/seeders/index.js core");
    console.log("\nAvailable seeders:");
    console.log("  - core");
    console.log("\n" + "=".repeat(50) + "\n");
    process.exit(0);
  } else {
    // Run specific seeder
    runSeeder(args[0]);
  }
};

// Run CLI handler if this file is executed directly
if (require.main === module) {
  handleCLI();
}

module.exports = {
  runAllSeeders,
  runSeeder,
};
