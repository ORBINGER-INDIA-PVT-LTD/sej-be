import db from "/Users/fahadmahmood/iCloud Drive (Archive) - 1/Documents/Devlopment/Saras/SEJ/safeexecutionofjobserver/src/models/index.js";

async function check() {
  const [results] = await db.sequelize.query("DESCRIBE users");
  console.log(results);
  process.exit(0);
}
check();
