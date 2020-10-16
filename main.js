'use strict';

// The adapter-core module gives you access to the core ioBroker functions, you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const schedule = require('node-schedule');
const adapterIntervals = {};

//Leistungswerte
const id_DCLeistung = 33556736;
const id_ACLeistung = 67109120;
const id_bezogeneEnergie = 83886848;
const id_Eigenverbrauch = 83888128;
const id_PVGesamtproduktion = 251658753;
const id_NetzFrequenz = 67110400;
const id_NetzCosPhi = 67110656;
const id_Betriebsstatus = 16780032;
//Ertrag-Tag
const id_Hausverbrauch_d = 251658754;
const id_Eigenverbrauch_d = 251659010;
const id_Eigenverbrauchsquote_d = 251659266;
const id_Autarkiegrad_d = 251659278;
//Ertrag-Gesamt
const id_Ertrag_G = 251658753;
const id_Hausverbrauch_G = 251659009;
const id_Eigenverbrauch_G = 251659265;
const id_Eigenverbrauchsquote_G = 251659280;
const id_Autarkiegrad_G = 251659281;
const id_Betriebszeit = 251658496;
//Momentanwerte-PVGenertor
const id_DC1Spannung = 33555202;
const id_DC1Strom = 33555201;
const id_DC1Leistung = 33555203;
const id_DC2Spannung = 33555458;
const id_DC2Strom = 33555457;
const id_DC2Leistung = 33555459;
//Momentanwerte-Haus
const id_HausverbrauchSolar = 83886336;
const id_HausverbrauchBatterie = 83886592;
const id_HausverbrauchNetz = 83886848;
const id_HausverbrauchPhase1 = 83887106;
const id_HausverbrauchPhase2 = 83887362;
const id_HausverbrauchPhase3 = 83887618;
//Momentamwerte-Netz
const id_SpannungPhase1 = 67109378;
const id_StromPhase1 = 67109377;
const id_LeistungPhase1 = 67109379;
const id_SpannungPhase2 = 67109634;
const id_StromPhase2 = 67109633;
const id_LeistungPhase2 = 67109635;
const id_SpannungPhase3 = 67109890;
const id_StromPhase3 = 67109889;
const id_LeistungPhase3 = 67109891;
//Batterie
const id_Ladezustand = 33556229;
const id_Ladezyklen = 33556228;
const id_Temperatur = 33556227;
const id_Spannung = 33556226;
const id_Strom = 33556238;
const id_Laden_Entladen = 33556230;

var KostalRequest_Leistung = '';
var KostalRequest_PVGenerator = ''; 
var KostalRequest_Haus = '';
var KostalRequest_Netz = '';
var KostalRequest_Battery = '';
var KostalRequest = ''; // IP request-string for PicoBA current data
var KostalRequestDay = ''; // IP request-string for PicoBA daily statistics
var KostalRequestTotal = ''; // IP request-string for PicoBA total statistics

class KostalPiko extends utils.Adapter {

    /****************************************************************************************
    * @param {Partial<utils.AdapterOptions>} [options={}]
    */
    constructor(options) {
        super({
            ...options,
            name: 'kostal-piko'
        });
        this.on('ready', this.onReady.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /****************************************************************************************
    * Is called when databases are connected and adapter received configuration.
    */
    async onReady() {
        if (!this.config.ipaddress) {
            this.log.error('Kostal Piko IP address not set');
        } else {
            this.log.info(`IP address found in config: ${this.config.ipaddress}`);
        }

        if (!this.config.polltimelive) {
            this.config.polltimelive = 10000;
            this.log.warn(`Polltime not set or zero - will be set to ${(this.config.polltimelive / 1000)} seconds`);
        }
        this.log.info(`Polltime set to: ${(this.config.polltimelive / 1000)} seconds`);

        if (!this.config.polltimedaily) {
            this.config.polltimedaily = 60000;
            this.log.warn(`Polltime statistics data not set or zero - will be set to ${(this.config.polltimedaily / 1000)} seconds`);
        }
        this.log.info(`Polltime daily statistics set to: ${(this.config.polltimedaily / 1000)} seconds`);

        if (!this.config.polltimetotal) {
            this.config.polltimetotal = 200000;
            this.log.warn(`Polltime alltime statistics not set or zero - will be set to ${(this.config.polltimetotal / 1000)} seconds`);
        }
        this.log.info(`Polltime alltime statistics set to: ${(this.config.polltimetotal / 1000)} seconds`);


        if (this.config.ipaddress) {

            KostalRequest_Leistung = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_DCLeistung}`
                + `&dxsEntries=${id_ACLeistung}`
                + `&dxsEntries=${id_bezogeneEnergie}`
                + `&dxsEntries=${id_Eigenverbrauch}`
                + `&dxsEntries=${id_PVGesamtproduktion}`
                + `&dxsEntries=${id_NetzFrequenz}`
                + `&dxsEntries=${id_NetzCosPhi}`
                + `&dxsEntries=${id_Betriebsstatus}`;

            KostalRequest_PVGenerator = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_DC1Spannung}`
                + `&dxsEntries=${id_DC1Strom}`
                + `&dxsEntries=${id_DC1Leistung}`
                + `&dxsEntries=${id_DC2Spannung}`
                + `&dxsEntries=${id_DC2Strom}`
                + `&dxsEntries=${id_DC2Leistung}`;

            KostalRequest_Haus = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_HausverbrauchSolar}`
                + `&dxsEntries=${id_HausverbrauchBatterie}`
                + `&dxsEntries=${id_HausverbrauchNetz}`
                + `&dxsEntries=${id_HausverbrauchPhase1}`
                + `&dxsEntries=${id_HausverbrauchPhase2}`
                + `&dxsEntries=${id_HausverbrauchPhase3}`;

            KostalRequest_Netz = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_SpannungPhase1}`
                + `&dxsEntries=${id_StromPhase1}`
                + `&dxsEntries=${id_LeistungPhase1}`
                + `&dxsEntries=${id_SpannungPhase2}`
                + `&dxsEntries=${id_StromPhase2}`
                + `&dxsEntries=${id_LeistungPhase2}`
                + `&dxsEntries=${id_SpannungPhase3}`
                + `&dxsEntries=${id_StromPhase3}`
                + `&dxsEntries=${id_LeistungPhase3}`;

            KostalRequestDay = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_Hausverbrauch_d}`
                + `&dxsEntries=${id_Eigenverbrauch_d}`
                + `&dxsEntries=${id_Eigenverbrauchsquote_d}`
                + `&dxsEntries=${id_Autarkiegrad_d}`;

            KostalRequestTotal = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_Ertrag_G}`
                + `& dxsEntries=${id_Hausverbrauch_G}`
                + `&dxsEntries=${id_Eigenverbrauch_G}`
                + `& dxsEntries=${id_Eigenverbrauchsquote_G}`
                + `&dxsEntries=${id_Autarkiegrad_G}`
                + `& dxsEntries=${id_Betriebszeit}`;

            KostalRequest_Battery = `http://${this.config.ipaddress}/api/dxs.json`
                + `?dxsEntries=${id_Ladezustand}`
                + `&dxsEntries=${id_Ladezyklen}`
                + `&dxsEntries=${id_Temperatur}`
                + `&dxsEntries=${id_Spannung}`
                + `&dxsEntries=${id_Strom}`
                + `&dxsEntries=${id_Laden_Entladen}`;

            this.log.debug('OnReady done');
            await this.ReadPikoTotal();
            await this.ReadPikoDaily();
            await this.Scheduler();
            this.log.debug('Initial ReadPiko done');
        } else {
            this.stop;
        }
    }

    /****************************************************************************************
    * Is called when adapter shuts down - callback has to be called under any circumstances!
    * @param {() => void} callback */
    onUnload(callback) {
        try {
            clearTimeout(adapterIntervals.live);
            clearTimeout(adapterIntervals.daily);
            clearTimeout(adapterIntervals.total);
            Object.keys(adapterIntervals).forEach(interval => clearInterval(adapterIntervals[interval]));
            this.log.info('Adapter Kostal-Piko cleaned up everything...');
            callback();
        } catch (e) {
            callback();
        }
    }


    /****************************************************************************************
    * Scheduler
    */
    Scheduler() {
        this.ReadPiko();
        try {
            clearTimeout(adapterIntervals.live);
            adapterIntervals.live = setTimeout(this.Scheduler.bind(this), this.config.polltimelive);
        } catch (e) {
            this.log.error(`Error in setting adapter schedule: ${e}`);
            this.restart;
        }
    }


    /****************************************************************************************
    * ReadPiko
    */
    ReadPiko() {
        var got = require('got');
        (async () => {
            try {
                // KostalRequest_Leistung
                var response = await got(KostalRequest_Leistung);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Leistungswerte.DCLeistung', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Leistungswerte.ACLeistung', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Leistungswerte.bezogeneEnergie', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Leistungswerte.Eigenverbrauch', { val: Math.floor(result[3].value), ack: true });
                    this.setStateAsync('Leistungswerte.PVGesamtproduktion', { val: Math.floor(result[4].value), ack: true });
                    this.setStateAsync('Leistungswerte.NetzFrequenz', { val: Math.floor(result[5].value), ack: true });
                    this.setStateAsync('Leistungswerte.NetzCosPhi', { val: Math.floor(result[6].value), ack: true });
                    this.setStateAsync('Leistungswerte.Betriebsstatus', { val: Math.floor(result[7].value), ack: true });
                    this.log.debug('kOSTAL-Piko live data Leistung updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Kostal-Piko: ${KostalRequest}`);
                }
                            // Momentanwerte-PVGenertor
                var response = await got(KostalRequest_PVGenerator);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Momentanwerte-PVGenertor.DC1Spannung', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Momentanwerte-PVGenertor.DC1Strom', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Momentanwerte-PVGenertor.DC1Leistung', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Momentanwerte-PVGenertor.DC2Spannung', { val: Math.floor(result[3].value), ack: true });
                    this.setStateAsync('Momentanwerte-PVGenertor.DC2Strom', { val: Math.floor(result[4].value), ack: true });
                    this.setStateAsync('Momentanwerte-PVGenertor.DC2Leistung', { val: Math.floor(result[5].value), ack: true });
                    this.log.debug('kOSTAL-Piko live data PVGenertor updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Kostal-Piko: ${KostalRequest}`);
                }
                // Momentanwerte-Haus
                var response = await got(KostalRequest_Haus);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchSolar', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchBatterie', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchNetz', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchPhase1', { val: Math.floor(result[3].value), ack: true });
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchPhase2', { val: Math.floor(result[4].value), ack: true });
                    this.setStateAsync('Momentanwerte-Haus.HausverbrauchPhase3', { val: Math.floor(result[5].value), ack: true });
                    this.log.debug('kOSTAL-Piko live data Haus updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Kostal-Piko: ${KostalRequest}`);
                }
                // Momentamwerte-Netz
                var response = await got(KostalRequest_Netz);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Momentanwerte-Netz.SpannungPhase1', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.StromPhase1', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.LeistungPhase1', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.SpannungPhase2', { val: Math.floor(result[3].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.StromPhase2', { val: Math.floor(result[4].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.LeistungPhase2', { val: Math.floor(result[5].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.SpannungPhase3', { val: Math.floor(result[6].value), ack: true });
                    this.setStateAsync('Momentanwerte-Netz.StromPhase3', { val: Math.floor(result[7].value), ack: true })
                    this.setStateAsync('Momentanwerte-Netz.LeistungPhase3', { val: Math.floor(result[7].value), ack: true });
                    this.log.debug('kOSTAL-Piko live data Netz updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Kostal-Piko: ${KostalRequest}`);
                }
                // Batterie
                var response = await got(KostalRequest_Battery);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Batterie.Ladezustand', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Batterie.Ladezyklen', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Batterie.Temperatur', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Batterie.Spannung', { val: Math.floor(result[3].value), ack: true });
                    this.setStateAsync('Batterie.Strom', { val: Math.floor(result[4].value), ack: true });
                    this.setStateAsync('Batterie.Laden_Entladen', { val: Math.floor(result[5].value), ack: true });
                    this.log.debug('kOSTAL-Piko live data Batterie updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Kostal-Piko: ${KostalRequest}`);
                }
            } catch (e) {
                this.log.error(`Error in calling Piko API: ${e}`);
                this.log.error(`Please verify IP address: ${this.config.ipaddress} !!!`);
            } // END try catch
        })();
    } // END ReadPiko

    /****************************************************************************************
    * ReadPikoDaily
    */
    ReadPikoDaily() {
        var got = require('got');
        (async () => {
            try {
                var response = await got(KostalRequestDay);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Ertrag-Tag.Hausverbrauch_d', { val: Math.round(result[0].value) / 1000, ack: true });
                    this.setStateAsync('Ertrag-Tag.Eigenverbrauch_d', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Ertrag-Tag.Eigenverbrauchsquote_d', { val: Math.round(result[2].value) / 1000, ack: true });
                    this.setStateAsync('Ertrag-Tag.Autarkiegrad_d', { val: Math.round(result[3].value) / 1000, ack: true });
                    this.log.debug('kOSTAL-Piko daily data updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Piko-BA: ${KostalRequest}`);
                }
            } catch (e) {
                this.log.error(`Error in calling Piko API: ${e}`);
                this.log.error(`Please verify IP address: ${this.config.ipaddress} !!!`);
            } // END try catch
            clearTimeout(adapterIntervals.daily);
            adapterIntervals.daily = setTimeout(this.ReadPikoDaily.bind(this), this.config.polltimedaily);
        })();
    } // END ReadPikoDaily

    /****************************************************************************************
    * ReadPikoTotal
    * */
    ReadPikoTotal() {
        var got = require('got');
        (async () => {
            try {
                var response = await got(KostalRequestTotal);
                if (!response.error && response.statusCode == 200) {
                    var result = await JSON.parse(response.body).dxsEntries;
                    this.setStateAsync('Ertrag-Gesamt.Ertrag_G', { val: Math.round(result[0].value), ack: true });
                    this.setStateAsync('Ertrag-Gesamt.Hausverbrauch_G', { val: Math.round(result[1].value), ack: true });
                    this.setStateAsync('Ertrag-Gesamt.Eigenverbrauch_G', { val: Math.round(result[2].value), ack: true });
                    this.setStateAsync('Ertrag-Gesamt.Eigenverbrauchsquote_G', { val: Math.round(result[3].value), ack: true });
                    this.setStateAsync('Ertrag-Gesamt.Autarkiegrad_G', { val: Math.round(result[4].value), ack: true });
                    this.setStateAsync('Ertrag-Gesamt.Betriebszeit', { val: result[5].value, ack: true });
                    this.log.debug('Kostal-Piko lifetime data updated');
                }
                else {
                    this.log.error(`Error: ${response.error} by polling Piko-BA: ${KostalRequest}`);
                }
            } catch (e) {
                this.log.error(`Error in calling Piko API: ${e}`);
                this.log.error(`Please verify IP address: ${this.config.ipaddress} !!!`);
            } // END try catch
        })();
        clearTimeout(adapterIntervals.total);
        adapterIntervals.total = setTimeout(this.ReadPikoTotal.bind(this), this.config.polltimetotal);
    } // END ReadPikoTotal

} // END Class


// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
    * @param {Partial<utils.AdapterOptions>} [options={}]
    */
    module.exports = (options) => new KostalPiko(options);
} else { // otherwise start the instance directly
    new KostalPiko();
}
