/**
 * This instantiates the ReactiveBeaconRegion instance, a reactive data source for beacon information for the currently
 * monitored / ranged beacon region.
 *
 * @param beaconRegion an object describing the beacon region to monitor/range, with properties identifier, uuid, major, and minor
 * @param disableMonitoring true if monitoring is to be disabled; optional defaults to false
 * @param disableRanging true if ranging is to be disabled; optional defaults to false
 * @constructor
 */
ReactiveBeaconRegion = function(beaconRegion, disableMonitoring, disableRanging) {

    // check the provided beaconRegion
    check(beaconRegion, {
        identifier: String,
        uuid: String,
        // Optional, but if present must be number.
        // Checks for no major/minor property, or value is undefined, null, or Number
        major: Match.Optional(Match.OneOf(undefined, null, Number)),
        minor: Match.Optional(Match.OneOf(undefined, null, Number))
    });

    check(disableMonitoring, Match.Optional(Boolean));
    check(disableRanging, Match.Optional(Boolean));

    // create a new Dependency
    this.dep = new Tracker.Dependency();

    // default disabling of monitoring and ranging to false
    if (disableMonitoring == null) {
        disableMonitoring = false;
    }

    if (disableRanging == null) {
        disableRanging = false;
    }

    // create this object's reactive beaconRegion and collection of beacons being monitored/ranged
    this.beaconRegion = beaconRegion;
    this.beaconRegion.beacons = [];
    this.beaconRegion.inRegion = null;

    // turn off logging
    cordova.plugins.locationManager.disableDebugLogs();

    // setup beacon monitoring and ranging
    var delegate = new cordova.plugins.locationManager.Delegate();
    var self = this;

    // callback to determine new monitoring state based on CLRegionState value
    delegate.didDetermineStateForRegion = function (pluginResult) {
        var newState = null;
        if (pluginResult.state === "CLRegionStateInside") {
            newState = true;
        } else if (pluginResult.state === "CLRegionStateOutside") {
            newState = false;
        } else if (pluginResult.state === "CLRegionStateUnknown") {
            newState = null;
        }

        // if new state, then invalidate dependencies
        if (self.beaconRegion.inRegion != newState) {
            self.beaconRegion.inRegion = newState;
            self.dep.changed();
        }
    };

    delegate.didStartMonitoringForRegion = function (pluginResult) {
        console.log('didStartMonitoringForRegion: ' + JSON.stringify(pluginResult));
    };

    delegate.didRangeBeaconsInRegion = function (pluginResult) {
        var newBeacons = [];
        for (var i = 0; i < pluginResult.beacons.length; i++)
        {
            // Insert beacon into table of found beacons.
            var newBeacon = pluginResult.beacons[i];
            newBeacons.push(newBeacon);
        }

        // determine if there's a difference and if so update and invalidate dependencies
        if (self._areBeaconsUpdated(newBeacons)) {
            self.beaconRegion.beacons = newBeacons;
            self.dep.changed();
        }
    };

    var targetBeaconRegion = new cordova.plugins.locationManager.BeaconRegion(beaconRegion.identifier, beaconRegion.uuid, beaconRegion.major, beaconRegion.minor, true);

    cordova.plugins.locationManager.setDelegate(delegate);

    // required in iOS 8+
    if (disableMonitoring) {
        cordova.plugins.locationManager.requestWhenInUseAuthorization();
    } else {
        // need location services to always be enabled for monitoring support
        cordova.plugins.locationManager.requestAlwaysAuthorization();
    }

    // Start ranging.
    if (!disableRanging) {
        cordova.plugins.locationManager.startRangingBeaconsInRegion(targetBeaconRegion)
            .fail(console.error)
            .done();
    }

    // start monitoring
    if (!disableMonitoring) {
        cordova.plugins.locationManager.startMonitoringForRegion(targetBeaconRegion)
            .fail(console.error)
            .done();
    }
};

/**
 * This function returns the current beacons being monitored / ranged.
 * @returns {Array}
 */
ReactiveBeaconRegion.prototype.getBeaconRegion = function() {
    this.dep.depend();
    return this.beaconRegion;
};

/**
 * This method determines if the given beacons are different than the current beacons
 * @param newBeacons
 * @private
 */
ReactiveBeaconRegion.prototype._areBeaconsUpdated = function(newBeacons) {
    return this.beaconRegion.beacons.length != newBeacons.length ||
        _.uniq(this.beaconRegion.beacons.concat(newBeacons), false,
            function(beacon){return JSON.stringify(beacon)}).length != this.beaconRegion.beacons.length;
};


/**
 * This object allows the client to advertise as a beacon
 */
ReactiveBeaconAdvertiser = function() {

    /*
    // check the provided beaconRegion
    check(beaconRegion, {
        identifier: String,
        uuid: String,
        // Optional, but if present must be number.
        // Checks for no major/minor property, or value is undefined, null, or Number
        major: Match.Optional(Match.OneOf(undefined, null, Number)),
        minor: Match.Optional(Match.OneOf(undefined, null, Number))
    });
*/
    
    // turn off logging
    cordova.plugins.locationManager.disableDebugLogs();

    // setup beacon monitoring and ranging
    var delegate = new cordova.plugins.locationManager.Delegate();
    var self = this;

    cordova.plugins.locationManager.setDelegate(delegate);

};

/**
 * Simple Boolean Callback used when asking about something's status
 * @callback ReactiveBeaconAdvertiser~onBooleanResult
 * @param {Boolean} booleanValue
 */

/**
 * Find out whether the device can advertise 
 * @param {ReactiveBeaconAdvertiser~onBooleanResult} callback - called to deliver the boolean value
 */
ReactiveBeaconAdvertiser.prototype.canAdvertise= function(callback) {

    cordova.plugins.locationManager.isAdvertisingAvailable()
    .then(function(isSupported){
        callback(isSupported);
    })
    .fail(console.error)
    .done();
};


/**
 * Find out whether the device is currently advertising 
 * @param {ReactiveBeaconAdvertiser~onBooleanResult} callback - called to deliver the boolean value
 */
ReactiveBeaconAdvertiser.prototype.isAdvertising= function(callback) {

    cordova.plugins.locationManager.isAdvertising()
    .then(function(isAdvertising){
        callback(isAdvertising);
    })
    .fail(console.error)
    .done();
};

/**
 * Callback used when handling pluginResult events from Cordova 
 * @callback ReactiveBeaconAdvertiser~callbackPluginResult
 * @param {Object} pluginResult 
 */

/**
 * Begin advertising with a certain UUID, major and minor
 * @param {String} uuid - the unique identifier for the beacon
 * @param {Number} major - the major int
 * @param {Number} minor - the minor int
 * @param {ReactiveBeaconAdvertiser~callbackPluginResult} onStarted - callback that reports when the beacon starts advertising
 * @param {ReactiveBeaconAdvertiser~callbackPluginResult} onStateChanged - callback that reports when the beacon state changes
 */
ReactiveBeaconAdvertiser.prototype.startAdvertising= function(uuid, identifier, major, minor, onStarted, onStateChanged) {
    var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);

    // The Delegate is optional
    var delegate = new cordova.plugins.locationManager.Delegate();

    // Event when advertising starts (there may be a short delay after the request)
    // The property 'region' provides details of the broadcasting Beacon
    delegate.peripheralManagerDidStartAdvertising = onStarted;

    // Event when bluetooth transmission state changes 
    // If 'state' is not set to BluetoothManagerStatePoweredOn when advertising cannot start
    delegate.peripheralManagerDidUpdateState = onStateChanged;

    cordova.plugins.locationManager.setDelegate(delegate);

    // Verify the platform supports transmitting as a beacon
    cordova.plugins.locationManager.isAdvertisingAvailable()
        .then(function(isSupported){
            if (isSupported) {
                cordova.plugins.locationManager.startAdvertising(beaconRegion)
            .fail(console.error)
            .done();
            } else {
                console.log("Advertising not supported");
            }
        })
    .fail(console.error)
    .done();
}

/**
 * Stop the device from advertising 
 */
ReactiveBeaconAdvertiser.prototype.stopAdvertising= function() {
    cordova.plugins.locationManager.stopAdvertising()
        .fail(console.error)
        .done();
}

