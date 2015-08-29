
/**
 * Test to ensure ReactiveBeaconRegion is accessible
 */
Tinytest.add('ReactiveBeaconRegion exists', function (test) {
  test.isNotUndefined(ReactiveBeaconRegion, "Expected ReactiveBeaconRegion to be defined")
});

/**
 * Test to ensure ReactiveBeaconRegion accepts a valid beaconRegion
 */
Tinytest.add('beaconRegion is valid', function (test) {
    test.throws(function(){new ReactiveBeaconRegion()});
    test.throws(function(){new ReactiveBeaconRegion({identifier:1, uuid:"123"})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:1})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:1, minor:"123"})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:1})});
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}), ReactiveBeaconRegion);
});

/**
 * Test to ensure ReactiveBeaconRegion accepts a valid disable flags
 */
Tinytest.add('disableMonitoring and disableRanging are valid', function (test) {
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, 1, true)});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, true, 1)});
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, true, true), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, false, true), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, true, false), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"}, false, false), ReactiveBeaconRegion);
});

// TODO: Test to ensure disable flags don't start ranging / monitoring
// Need spy support or do it via the locationManager stub

/**
 * Test areBeaconsUpdated detecting same collection of beacon information
 */
Tinytest.add('same beacon information is detected', function (test) {
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"});
    var existingBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];
    reactiveBeaconRegion.beaconRegion.beacons = existingBeacons;
    test.isFalse(reactiveBeaconRegion.areBeaconsUpdated(existingBeacons), "Expected beacon comparison to detect same beacons");
});

/**
 * Test areBeaconsUpdated detecting different collection of beacon information
 */
Tinytest.add('different beacon information is detected', function (test) {
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"});
    var existingBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];
    var differentBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityFar" /* changed */,
            "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];
    var additionalBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13913, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"} // added
    ];
    reactiveBeaconRegion.beaconRegion.beacons = existingBeacons;
    test.isTrue(reactiveBeaconRegion.areBeaconsUpdated(differentBeacons), "Expected beacon comparison to detect different beacons");
    test.isTrue(reactiveBeaconRegion.areBeaconsUpdated(additionalBeacons), "Expected beacon comparison to detect different beacons");
});


/**
 * Test areBeaconsUpdated detecting an updated collection with an additional beacon added
 */
Tinytest.add('different beacon information with new beacon is detected', function (test) {
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"});
    var existingBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];
    var newBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];
    reactiveBeaconRegion.beaconRegion.beacons = existingBeacons;
    test.isTrue(reactiveBeaconRegion.areBeaconsUpdated(newBeacons), "Expected beacon comparison to detect different beacons");
});

/**
 * Test reactivity on updated beacon monitoring
 */
Tinytest.add('reactive computation updates when ReactiveBeaconRegion monitoring updates', function (test) {
    var inRegion = false;
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"});
    var computationRanAgain = false;

    Tracker.autorun(function(computation) {
        var beaconRegion = reactiveBeaconRegion.getBeaconRegion();
        inRegion = beaconRegion.inRegion;
        if (!computation.firstRun) {
            computationRanAgain = true;
        }
    })

    test.isNull(inRegion, "Expected inRegion to be null on initial instanciation of ReactiveBeaconRegion");

    // simulate in region of beacon region
    cordova.plugins.locationManager.getDelegate().didDetermineStateForRegion( {
        state: "CLRegionStateInside"
    });
    Tracker.flush();
    test.isTrue(inRegion, "Expected inRegion to be true on CLRegionStateInside state");

    // simulate out of region of beacon region
    cordova.plugins.locationManager.getDelegate().didDetermineStateForRegion( {
        state: "CLRegionStateOutside"
    });
    Tracker.flush();
    test.isFalse(inRegion, "Expected inRegion to be false on CLRegionStateOutside state");

    // simulate same beacon region
    computationRanAgain = false;
    cordova.plugins.locationManager.getDelegate().didDetermineStateForRegion( {
        state: "CLRegionStateOutside"
    });
    Tracker.flush();
    test.isFalse(computationRanAgain, "Expected computation to not run again on same beacon monitoring information");

    // simulate unknown beacon region state
    cordova.plugins.locationManager.getDelegate().didDetermineStateForRegion( {
        state: "invalid"
    });
    Tracker.flush();
    test.isNull(inRegion, "Expected inRegion to be null on invalid monitor state");
});

/**
 * Test reactivity on updated beacon ranging
 */
Tinytest.add('reactive computation updates when ReactiveBeaconRegion ranging updates', function (test) {
    var computationRanAgain = false;
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:"123"});
    Tracker.autorun(function(computation) {
        var beaconRegion = reactiveBeaconRegion.getBeaconRegion();
        if (!computation.firstRun) {
            computationRanAgain = true;
        }
    })

    // simulate beacons being detected
    cordova.plugins.locationManager.getDelegate().didRangeBeaconsInRegion( {
        beacons: [
            {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
            {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
        ]
    });
    Tracker.flush();
    test.isTrue(computationRanAgain, "Expected computation to run on initial beacon ranging information");

    // setup and simulate next update
    computationRanAgain = false;
    cordova.plugins.locationManager.getDelegate().didRangeBeaconsInRegion( {
        beacons: [
            {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
            {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityFar" /* changed! */, "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
        ]
    });
    Tracker.flush();
    test.isTrue(computationRanAgain, "Expected computation to run on beacon ranging update");

    // setup and simulate but with no update to ranging information
    computationRanAgain = false;
    cordova.plugins.locationManager.getDelegate().didRangeBeaconsInRegion( {
        beacons: [
            {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
            {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityFar", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
        ]
    });
    Tracker.flush();
    test.isFalse(computationRanAgain, "Expected computation to not run again on same beacon ranging information");

});