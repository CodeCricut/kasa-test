const { Client } = require("tplink-smarthome-api");
const interfaces = require("os").networkInterfaces();

// client is low-level interface for discovering and interacting with devices
const client = new Client();
const devices = [];

/**
 * This function must be called and awaited before getAllDevices will return any meaningful
 * data. Once awaited, at least one device will have been found if there are any devices on the
 * network. If no devices can be found, then getAllDevices will not return any devices.
 *
 * If you are trying to find multiple devices, then discoverDevices may return before all devices
 * have been found. It may be a good idea to timeout after calling this method in order to ensure
 * all devices have been found.
 * @returns A promise that resolves when at least one device has been found or if the discover timeout
 * has been reached.
 */
async function discoverDevices() {
    // Promises are how JS does async/await. It takes two args:
    //  resolve - a "callback" function that you call when you want to return from the function
    //  reject - a "callback" function that you call if something has gone (essentially throwing an exception)
    return new Promise((resolve, reject) => {
        // We must look for devices on all IP addresses since the default IP varies from computer to computer
        const addresses = getBindingAddresses();
        for (const address of addresses) {
            startDiscovery(address)
                .on("plug-new", (plug) => {
                    console.log(
                        `Found device ${plug.id} that does ${
                            plug.supportsEmeter ? "" : "not "
                        }support emitter`
                    );

                    // Only want to find smart outlets which support monitoring energy levels
                    if (plug.supportsEmeter) {
                        devices.push(plug);
                    }

                    // basically return from the function since we have found at least one device
                    resolve();
                })
                // return from the function if we couldn't find any devices after a timeout period of 20 seconds
                .on("device-offline", () => resolve());
        }
    });
}

function getAllDevices() {
    return devices;
}

function startDiscovery(bindAddress) {
    console.log("Starting discovery on interface: " + bindAddress);
    return client.startDiscovery({
        deviceTypes: ["plug"],
        address: bindAddress,
        discoveryTimeout: 20000,
    });
}

/**
 * @returns A list of IP addresses which the smart outlets may be listening on.
 */
function getBindingAddresses() {
    return Object.keys(interfaces)
        .reduce((results, name) => results.concat(interfaces[name]), [])
        .filter((iface) => iface.family === "IPv4" && !iface.internal)
        .map((iface) => iface.address);
}

module.exports.discoverDevices = discoverDevices;
module.exports.getAllDevices = getAllDevices;
