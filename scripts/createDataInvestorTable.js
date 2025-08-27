const DataInvestor = require("../models/DataInvestor");

async function createDataInvestorTable() {
  try {
    console.log("Creating data_investor table...");
    await DataInvestor.createTable();
    console.log("Data investor table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating data_investor table:", error);
    process.exit(1);
  }
}

createDataInvestorTable();
