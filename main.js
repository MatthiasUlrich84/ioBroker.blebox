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

		this.initCommon();
		this.getBleboxUptime(true);
		this.getBleboxSettingsState(true);
		this.getBleboxDeviceState(true);
		this.getBleboxShutterState(true);
		this.getBleboxRelayState(true);


		const iob = this;
		schedule.scheduleJob("*/10 * * * *", function () {
			iob.getBleboxUptime();
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
			let response = {};
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			switch (id) {
				case this.namespace + ".command.shutterbox.move":
					switch (state.val) {
						case "d":
							this.log.info("moving down");
							response = await this.getSimpleObject("sendDown", null);
							response["command.shutterbox.move"] = "";
							await this.setIobStates(response);
							this.getBleboxShutterState();
							break;
						case "u":
							this.log.info("moving up");
							response = await this.getSimpleObject("sendUp", null);
							response["command.shutterbox.move"] = "";
							await this.setIobStates(response);
							this.getBleboxShutterState();
							break;
						case "s":
							this.log.info("moving stop");
							response = await this.getSimpleObject("sendStop", null);
							response["command.shutterbox.move"] = "";
							await this.setIobStates(response);
							this.getBleboxShutterState();
							break;

					}
					break;
				case this.namespace + ".command.switchboxD.relays.relay1":
					switch (state.val) {
						case "on":
							this.log.info("relay1 on");
							response = await this.getSimpleObject("SBDsendRel1On", null);
							response["command.switchboxD.relays.relay1"] = "";
							await this.setIobStates(response);
							this.getBleboxRelayState();
							break;
						case "off":
							this.log.info("relay1 off");
							response = await this.getSimpleObject("SBDsendRel1Off", null);
							response["command.switchboxD.relays.relay1"] = "";
							await this.setIobStates(response);
							this.getBleboxRelayState();
							break;
						case "tog":
							this.log.info("relay1 toggle");
							response = await this.getSimpleObject("SBDsendRel1Toggle", null);
							response["command.switchboxD.relays.relay1"] = "";
							await this.setIobStates(response);
							this.getBleboxRelayState();
							break;
					}
					break;
					case this.namespace + ".command.switchboxD.relays.relay2":
						switch (state.val) {
							case "on":
								this.log.info("relay2 on");
								response = await this.getSimpleObject("SBDsendRel2On", null);
								response["command.switchboxD.relays.relay2"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
							case "off":
								this.log.info("relay2 off");
								response = await this.getSimpleObject("SBDsendRel2Off", null);
								response["command.switchboxD.relays.relay2"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
							case "tog":
								this.log.info("relay2 toggle");
								response = await this.getSimpleObject("SBDsendRel2Toggle", null);
								response["command.switchboxD.relays.relay2"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
						}
						break;
						case this.namespace + ".command.switchbox.relay":
						switch (state.val) {
							case "on":
								this.log.info("relay on");
								response = await this.getSimpleObject("SBsendRelOn", null);
								response["command.switchbox.relay"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
							case "off":
								this.log.info("relay off");
								response = await this.getSimpleObject("SBsendRelOff", null);
								response["command.switchbox.relay"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
							case "tog":
								this.log.info("relay toggle");
								response = await this.getSimpleObject("SBsendRelToggle", null);
								response["command.switchbox.relay"] = "";
								await this.setIobStates(response);
								this.getBleboxRelayState();
								break;
						}
						break;
				case this.namespace + "command.shutterbox.tilt":
					if ((state.val != "") && (state.val >= 0) && (state.val <= 100)) {
						this.log.info(`tilt: ${state.val}`);
						response = await this.getSimpleObject("tilt", state.val);
						response["command.shutterbox.tilt"] = "";
						await this.setIobStates(response);
						this.getBleboxShutterState();
					}
					break;
				case this.namespace + ".command.shutterbox.favorite":
					if ((state.val >= 1) && (state.val <= 4)) {
						this.log.info(`favorite: ${state.val}`);
						response = await this.getSimpleObject("favorite", state.val);
						response["command.shutterbox.favorite"] = "";
						await this.setIobStates(response);
						this.getBleboxShutterState();
					}
					break;
				case this.namespace + ".command.shutterbox.position":
					if ((state.val != "") && (state.val >= 0) && (state.val <= 100)) {
						this.log.info(`position: ${state.val}`);
						response = await this.getSimpleObject("position", state.val);
						response["command.shutterbox.position"] = "";
						await this.setIobStates(response);
						this.getBleboxShutterState();
					}
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
	async getBleboxDeviceState(init) {
		let states = {};
		states = await this.getSimpleObject("deviceState", null);
		if (init){
			await this.initIobStates(states);
		}
		await this.setIobStates(states);
		return true;
	}

	/**
	 * get uptime of Blebox
	 */
	async getBleboxUptime(init) {
		let states = {};
		states = await this.getSimpleObject("deviceUptime", null);
		if (init){
			await this.initIobStates(states);
		}
		await this.setIobStates(states);
		return true;
	}


	/**
	 * get settings of Blebox
	 */
	async getBleboxSettingsState(init) {
		let states = {};
		states = await this.getSimpleObject("settingsState", null);
		if (init){
			await this.initIobStates(states);
		}
		await this.setIobStates(states);
		return true;
	}

	/**
	 * get shutter state of Blebox
	 */
	async getBleboxShutterState(init) {
		let states = {};
		states = await this.getSimpleObject("shutterState", null);
		if (init){
			await this.initIobStates(states);
		}
		await this.setIobStates(states);
		return true;
	}
/**
	 * get relay state of Blebox
	 */
	async getBleboxRelayState(init) {
		let states = {};
		states = await this.getSimpleObject("relayState", null);
		if (init){
			await this.initIobStates(states);
		}
		await this.setIobStates(states);
		return true;
	}
	/**
	 * 
	 * @param {string} type apiPart to GET data from
	 */
	async getSimpleObject(type, val) {
		let states = {};
		const locationUrl = new Array();
		locationUrl["deviceState"] = "/api/device/state";
		locationUrl["deviceUptime"] = "/api/device/uptime";
		locationUrl["settingsState"] = "/api/settings/state";
		locationUrl["relayState"] = "/api/relay/state";
		locationUrl["sendUp"] = "/s/u";
		locationUrl["sendDown"] = "/s/d";
		locationUrl["sendStop"] = "/s/s";
		locationUrl["SBDsendRel1On"] = "/s/0/1";
		locationUrl["SBDsendRel1Off"] = "/s/0/0";
		locationUrl["SBDsendRel1Toggle"] = "/s/0/2";
		locationUrl["SBDsendRel2On"] = "/s/1/1";
		locationUrl["SBDsendRel2Off"] = "/s/1/0";
		locationUrl["SBDsendRel2Toggle"] = "/s/1/2";
		locationUrl["SBsendRelOn"] = "/s/1";
		locationUrl["SBsendRelOff"] = "/s/0";
		locationUrl["SBsendRelToggle"] = "/s/2";
		locationUrl["favorite"] = "/s/f/" + val;
		locationUrl["position"] = "/s/p/" + val;
		locationUrl["tilt"] = "/s/t/" + val;
		locationUrl["shutterState"] = "/api/shutter/state";
		this.log.info("getSimpleObject : " + type + " URL: " + locationUrl[type]);
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
	async initIobStates(states) {
		for (const key in states) {
			if (states.hasOwnProperty(key)) {
				const value = states[key];
				this.log.info("initIobStates: " + key + " = " + value);
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
				this.setIobStates(states);
			}
		}
	}

	/**
	 * 
	 * @param {object} states object of dotted styled keys with values e.g. device.ip = 192.168.1.2
	 */
	async setIobStates(states) {
		for (const key in states) {
			if (states.hasOwnProperty(key)) {
				const value = states[key];
				this.log.info("setIobStates: " + key + " = " + value);
				this.setState(key, value);
			}
		}
	}

	async initCommon() {
		const states = {
			"command.shutterbox.move": "",
			"command.shutterbox.favorite": "",
			"command.shutterbox.position": "",
			"command.shutterbox.tilt": "",
			"command.switchboxD.relays.relay1": "",
			"command.switchboxD.relays.relay2": "",
			"command.switchbox.relay": ""
		};
		await this.initIobStates(states);
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