"use strict";

const utils = require("@iobroker/adapter-core");
const axios = require("axios");
const fs = require("fs");
const dot = require("dot-object");
const tools = require(__dirname + "/lib/tools");
const schedule = require("node-schedule");

class Blebox extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "blebox",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		this.log.info("config host: " + this.config.host);
		this.log.info("config port: " + this.config.port);

		this.subscribeStates("command.*");

		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw ioboker: " + result);
		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);

		this.getUptime();
		this.initCommon();
		this.getSettingsState();
		this.getDeviceState();

		const iob = this;
		const job = schedule.scheduleJob("*/10 * * * *", function () {
			iob.getUptime();
		});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	async onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			switch (id) {
				case this.namespace + ".command.move":
					switch (state.val) {
						case "d":
							this.log.info("moving down");
							await this.getSimpleObject("sendDown");
							break;
						case "u":
							this.log.info("moving up");
							await this.getSimpleObject("sendUp");
							break;
					}
					break;
				case this.namespace + ".command.tilt":
					this.log.info(`tilt: ${state.val}`);
					break;
				case this.namespace + ".command.favorite":
					this.log.info(`favorite: ${state.val}`);
					break;
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	} 
	// }

	/**
	 * get device state of Blebox
	 */
	async getDeviceState() {
		let states = {};
		states = await this.getSimpleObject("deviceState");
		await this.updateStates(states);
		return true;
	}

	/**
	 * get uptime of Blebox
	 */
	async getUptime() {
		let states = {};
		states = await this.getSimpleObject("deviceUptime");
		await this.updateStates(states);
		return true;
	}


	/**
	 * get settings of Blebox
	 */
	async getSettingsState() {
		let states = {};
		states = await this.getSimpleObject("settingsState");
		await this.updateStates(states);
		return true;
	}

	/**
	 * 
	 * @param {string} type apiPart to GET data from
	 */
	async getSimpleObject(type) {
		let states = {};
		const locationUrl = new Array();
		locationUrl["deviceState"] = "/api/device/state";
		locationUrl["deviceUptime"] = "/api/device/uptime";
		locationUrl["settingsState"] = "/api/settings/state";
		locationUrl["sendUp"] = "/s/u";
		locationUrl["sendDown"] = "/s/d";
		this.log.info("getSimpleObject: " + type + " URL: " + locationUrl[type]);
		states = await this.simpleObjectUrlGetter(locationUrl[type]);
		return states;
	}

	/**
	 * 
	 * @param {string} path Path to json-File containing mock-data
	 * 					
	 * returns object of dotted styled keys with values e.g. device.ip = 192.168.1.2
	 */
	async simpleObjectFileGetter(path) {
		let buf = new Buffer("");
		let resp = "";
		buf = fs.readFileSync(__dirname + path);
		resp = buf.toString("UTF-8");
		const state_response = JSON.parse(resp);
		let states = {};
		try {
			states = dot.dot(state_response);
		} catch (error) {
			this.log.error("simpleObjectFileGetter: " + error);
		}
		return states;
	}

	/**
	 * 
	 * @param {string} url URL to GET data from
	 *
	 * returns object of dotted styled keys with values e.g. device.ip = 192.168.1.2
	 */
	async simpleObjectUrlGetter(url) {
		let states = {};
		let response = {};
		const iob = this;
		const res = "http://" + this.config.host + ":" + this.config.port + url;
		this.log.info("URL = " + res);
		response = await axios.default.get(res);
		this.log.info("body:" + JSON.stringify(response.data));
		//const state_response = JSON.parse(response.data);
		try {
			states = dot.dot(response.data);
			iob.log.info("data:" + JSON.stringify(states));
		} catch (error) {
			iob.log.error("simpleObjectUrlGetter: " + error);
		}
		return states;
	}

	/**
	 * 
	 * @param {object} states object of dotted styled keys with values e.g. device.ip = 192.168.1.2
	 */
	async updateStates(states) {
		for (const key in states) {
			if (states.hasOwnProperty(key)) {
				const value = states[key];
				this.log.info("updateStates: " + key + " = " + value);
				this.setObject(key, {
					type: tools.datapoints[key].type,
					common: {
						name: tools.datapoints[key].name,
						type: tools.datapoints[key].type,
						role: tools.datapoints[key].role,
						read: tools.datapoints[key].read,
						write: tools.datapoints[key].write,
					},
					native: {},
				});
				this.setState(key, value);
			}
		}
	}

	async initCommon() {
		const states = {
			"command.move": "",
			"command.favorite": "",
			"command.tilt": ""
		};
		await this.updateStates(states);
	}
}


// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Blebox(options);
} else {
	// otherwise start the instance directly
	new Blebox();
}