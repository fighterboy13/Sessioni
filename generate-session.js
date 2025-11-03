const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');

const ig = new IgApiClient();

const USERNAME = process.env.IG_USER || "nfyte_r";
const PASSWORD = process.env.IG_PASS || "g-223344";

async function generateSession() {
  try {
    ig.state.generateDevice(USERNAME);

    console.log("🔑 Logging in...");
    await ig.account.login(USERNAME, PASSWORD);

    const serialized = await ig.state.serialize();
    fs.writeFileSync("session.json", JSON.stringify(serialized, null, 2));

    console.log("✅ session.json generated successfully!");
  } catch (err) {
    console.error("❌ Login failed:", err.message);
  }
}

generateSession();
