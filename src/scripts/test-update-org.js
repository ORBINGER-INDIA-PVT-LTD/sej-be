import db from "../models/index.js";

async function testUpdate() {
  const { Organization } = db;
  try {
    console.log("Fetching organization with ID 1...");
    const org = await Organization.findByPk(1);
    if (!org) {
      console.error("❌ Organization with ID 1 not found!");
      // Create a dummy org just to test
      console.log("Creating dummy organization for testing...");
      await Organization.create({
        id: 1,
        OrgName: "Test Org",
        VendorCode: "TEST123",
        OrgAddress: "Test Address",
        email: "admin@test.com",
        contactNumber: "1234567890",
        password: "password123",
      });
      console.log("✅ Dummy organization created.");
    }

    const targetOrg = await Organization.findByPk(1);
    console.log("Target Organization:", targetOrg.toJSON());

    // Try modifying a field and saving to see if database sync throws error
    console.log("Attempting to update OrgAddress and save...");
    targetOrg.OrgAddress = "Updated Address " + Date.now();
    await targetOrg.save();
    console.log("✅ Update saved successfully in database!");

  } catch (err) {
    console.error("❌ Test failed with error:");
    console.error(err);
  }
  await db.sequelize.close();
  process.exit(0);
}

testUpdate();
