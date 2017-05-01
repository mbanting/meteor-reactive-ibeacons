/**
 * This instantiates the ReactiveBeaconRegion instance, a reactive data source for beacon information for the currently
 * monitored / ranged beacon region.
 *
 * @param beaconRegion an object describing the beacon region to monitor/range, with properties identifier, uuid, major, and minor
 * @param disableMonitoring true if monitoring is to be disabled; optional defaults to false
 * @param disableRanging true if ranging is to be disabled; optional defaults to false
 * @constructor
 */
ReactiveBeaconRegion = function(beaconRegion, disableMonitoring, disableRanging, disableConsoleLog) {

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
    this.logToConsole = !disableConsoleLog;

    // turn off logging
    cordova.plugins.locationManager.disableDebugLogs();

    // setup beacon monitoring and ranging
    this.delegate = new cordova.plugins.locationManager.Delegate();
    var self = this;

    // manage plugin logs
    this.log = function() {
        if(self.logToConsole) {
            console.log.apply(console, arguments);
        }
    }

    // callback to determine new monitoring state based on CLRegionState value
    this.delegate.didDetermineStateForRegion = function (pluginResult) {
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

    this.delegate.didStartMonitoringForRegion = function (pluginResult) {
        self.log('didStartMonitoringForRegion: ' + JSON.stringify(pluginResult));
    };

    this.delegate.didRangeBeaconsInRegion = function (pluginResult) {
        var newBeacons = [];
        for (var i = 0; i < pluginResult.beacons.length; i++)
        {
            // Insert beacon into table of found beacons.
            var newBeacon = pluginResult.beacons[i];

            // Android gives us strings instead of ints, I think because the cordova
            // plugin uses AltBeacon. Fix that here:
            if(newBeacon.major && ( typeof newBeacon.major === 'string')) {
                newBeacon.major = parseInt(newBeacon.major);
            }
            if(newBeacon.minor && ( typeof newBeacon.minor === 'string')) {
                newBeacon.minor = parseInt(newBeacon.minor);
            }

            newBeacons.push(newBeacon);
        }

        // determine if there's a difference and if so update and invalidate dependencies
        if (self._areBeaconsUpdated(newBeacons)) {
            self.beaconRegion.beacons = newBeacons;
            self.dep.changed();
        }
    };

    var targetBeaconRegion = new cordova.plugins.locationManager.BeaconRegion(beaconRegion.identifier, beaconRegion.uuid, beaconRegion.major, beaconRegion.minor, true);

    cordova.plugins.locationManager.setDelegate(this.delegate);

    // required in iOS 8+
    if (disableMonitoring) {
        cordova.plugins.locationManager.requestWhenInUseAuthorization();
    } else {
        // need location services to always be enabled for monitoring support
        cordova.plugins.locationManager.requestAlwaysAuthorization();
    }

    // Start ranging.
    if (!disableRanging) {
        self.log('starting ranging ' + JSON.stringify(targetBeaconRegion));
        cordova.plugins.locationManager.startRangingBeaconsInRegion(targetBeaconRegion)
            .fail(console.error)
            .done();
    }

    // start monitoring
    if (!disableMonitoring) {
        self.log('starting monitoring ' + JSON.stringify(targetBeaconRegion));
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
    this.log('getbeaconregion ' + JSON.stringify(this.beaconRegion));
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
 * Simple Boolean Callback used when asking about something's status
 * @callback ReactiveBeaconRegion~onBooleanResult
 * @param {Boolean} booleanValue
 */

/**
 * Find out whether the device can advertise 
 * @param {ReactiveBeaconRegion~onBooleanResult} callback - called to deliver the boolean value
 */
ReactiveBeaconRegion.prototype.canAdvertise= function(callback) {

    cordova.plugins.locationManager.isAdvertisingAvailable()
    .then(function(isSupported){
        callback(isSupported);
    })
    .fail(console.error)
    .done();
};


/**
 * Find out whether the device is currently advertising 
 * @param {ReactiveBeaconRegion~onBooleanResult} callback - called to deliver the boolean value
 */
ReactiveBeaconRegion.prototype.isAdvertising= function(callback) {

    cordova.plugins.locationManager.isAdvertising()
    .then(function(isAdvertising){
        callback(isAdvertising);
    })
    .fail(console.error)
    .done();
};

/**
 * Callback used when handling pluginResult events from Cordova 
 * @callback ReactiveBeaconRegion~callbackPluginResult
 * @param {Object} pluginResult 
 */

/**
 * Begin advertising with a certain UUID, major and minor
 * @param {String} uuid - the unique identifier for the beacon
 * @param {Number} major - the major int
 * @param {Number} minor - the minor int
 * @param {ReactiveBeaconRegion~callbackPluginResult} onStarted - callback that reports when the beacon starts advertising
 * @param {ReactiveBeaconRegion~callbackPluginResult} onStateChanged - callback that reports when the beacon state changes
 */
ReactiveBeaconRegion.prototype.startAdvertising= function(uuid, identifier, major, minor, onStarted, onStateChanged) {
    var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);

    // Event when advertising starts (there may be a short delay after the request)
    // The property 'region' provides details of the broadcasting Beacon
    this.delegate.peripheralManagerDidStartAdvertising = onStarted;

    // Event when bluetooth transmission state changes 
    // If 'state' is not set to BluetoothManagerStatePoweredOn when advertising cannot start
    this.delegate.peripheralManagerDidUpdateState = onStateChanged;

    cordova.plugins.locationManager.setDelegate(this.delegate);

    // Verify the platform supports transmitting as a beacon
    var self = this;
    cordova.plugins.locationManager.isAdvertisingAvailable()
        .then(function(isSupported){
            if (isSupported) {
                cordova.plugins.locationManager.startAdvertising(beaconRegion)
            .fail(console.error)
            .done();
            } else {
                self.log("Advertising not supported");
            }
        })
    .fail(console.error)
    .done();
}

/**
 * Stop the device from advertising 
 */
ReactiveBeaconRegion.prototype.stopAdvertising= function() {
    cordova.plugins.locationManager.stopAdvertising()
        .fail(console.error)
        .done();
}

