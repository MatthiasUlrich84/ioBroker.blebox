/**
 * Tests whether the given variable is a real object and not an Array
 * @param {any} it The variable to test
 * @returns {it is Record<string, any>}
 */
function isObject(it) {
	// This is necessary because:
	// typeof null === 'object'
	// typeof [] === 'object'
	// [] instanceof Object === true
	return Object.prototype.toString.call(it) === "[object Object]";
}

/**
 * Tests whether the given variable is really an Array
 * @param {any} it The variable to test
 * @returns {it is any[]}
 */
function isArray(it) {
	if (typeof Array.isArray === "function") return Array.isArray(it);
	return Object.prototype.toString.call(it) === "[object Array]";
}


const datapoints = {
	"command.shutterbox.move": { name: "move up (u) or down (d) or stop (s)", type: "state", role: "text", read: true, write: true },
    "command.switchboxD.relays.relay1": { name: "switch on (on) or off (off) or toggle (tog)", type: "state", role: "text", read: true, write: true },
    "command.switchboxD.relays.relay2": { name: "switch on (on) or off (off) or toggle (tog)", type: "state", role: "text", read: true, write: true },
    "command.switchbox.relay": { name: "switch on (on) or off (off) or toggle (tog)", type: "state", role: "text", read: true, write: true },
	"command.shutterbox.favorite": { name: "move to favorite-position 1-4", type: "state", role: "text", read: true, write: true },
	"command.shutterbox.position": { name: "move to position 0-100", type: "state", role: "text", read: true, write: true },
	"command.shutterbox.tilt": { name: "tilt-command", type: "state", role: "text", read: true, write: true },
	"device.deviceName": { name: "Devicename", type: "state", role: "text", read: true, write: false },
	"device.type": { name: "Type", type: "state", role: "text", read: true, write: false },
	"device.fv": { name: "Firmwareversion", type: "state", role: "text", read: true, write: false },
	"device.hv": { name: "Hardwareversion", type: "state", role: "text", read: true, write: false },
	"device.apiLevel": { name: "ApiLevel", type: "state", role: "text", read: true, write: false },
	"device.id": { name: "ID", type: "state", role: "text", read: true, write: false },
	"device.ip": { name: "IP-Adress", type: "state", role: "text", read: true, write: false },
	"uptimeS": { name: "Uptime in seconds", type: "state", role: "text", read: true, write: true },
	"settings.deviceName": { name: "Device name.", type: "state", role: "text", read: true, write: false },
	"settings.statusLed.enabled": { name: "Status led enabled (0 - disabled, 1 - enabled)", type: "state", role: "text", read: true, write: false },
	"settings.tunnel.enabled": { name: "Tunnel enabled (0 - disabled, 1 - enabled)", type: "state", role: "text", read: true, write: false },
	"settings.shutter.controlType": { name: "Type of controlled appliance. Where: 1 - segmented shutter, 2 - appliance without positioning, 3 - tilt shutter, 4 - window opener, 5, material shutter, 6 - awning, 7 - screen.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.moveTimeoutMs": { name: "Max time moving shutter in any direction in miliseconds.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.moveDirectionSwap": { name: "Move direction swap. Where: 0 - false, 1 - true.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.inputsSwap": { name: "Inputs swap. Where: 0 - false, 1 - true.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.calibrationParameters.isCalibarted": { name: "Information about shutter calibration. Where: 0 - not calibrated, 1 - calibrated.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.calibrationParameters.maxTiltTimeDownMs": { name: "Max tilt time up in miliseconds.", type: "state", role: "text", read: true, write: false },
	"settings.shutter.calibrationParameters.maxTiltTimeUpMs": { name: "Max tilt time down in miliseconds.", type: "state", role: "text", read: true, write: false },
	"shutter.state": { name: "Current shutter state. Where: 0 - Moving down, 1 - Moving up, 2 - Manually stopped, 3 - Lower limit, 4 - Upper limit.", type: "state", role: "text", read: true, write: false },
    "relays.state": { name: "test", type: "state", role: "text", read: true, write: false },   "shutter.currentPos.position": { name: "Current shutter position. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false },
    "relays.relay": { name: "test", type: "state", role: "text", read: true, write: false },   "shutter.currentPos.position": { name: "Current shutter position. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false },
    "shutter.currentPos.tilt": { name: "Current tilt. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false },
	"shutter.desiredPos.position": { name: "Desired shutter position. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: true },
	"shutter.desiredPos.tilt": { name: "Desired tilt. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false },
	"shutter.favPos.position": { name: "Favorite shutter position. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false },
	"shutter.favPos.tilt": { name: "Favorite tilt. Value from 0 to 100 or -1 - unknown.", type: "state", role: "text", read: true, write: false }
};


/**
 * 
 * @param {string} endpoint Datapoint to get prefix for
 * @param {string} key 
 */
function getDatapoint(endpoint, key) {
	let ret = null;
	switch (endpoint) {
		case "deviceState":
			ret = "device." + key;
			break;

		case "deviceUptime":
			ret = key;
			break;

		case "settingsState":
			ret = "settings." + key;
			break;
        case "relaysState":
              ret = "relays." + key;
             break;
		default:
			break;
	}
	return ret;
}



module.exports = {
	isArray,
	isObject,
	datapoints,
	getDatapoint
};
