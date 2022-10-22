const deviceManager = require("./services/device-manager");

async function main() {
    await deviceManager.discoverDevices();
    const devices = deviceManager.getAllDevices();
    console.dir(devices);
}

main();
