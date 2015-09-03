
/**
 * Test to ensure ReactiveBeaconRegion is accessible
 */
Tinytest.add('ReactiveBeaconRegion exists', function (test) {
  test.isNotUndefined(ReactiveBeaconRegion, "Expected ReactiveBeaconRegion to be defined")
});

/**
 * Test to ensure ReactiveBeaconRegion accepts a valid beaconRegion and disable flags
 */
Tinytest.add('new ReactiveBeaconRegion()', function (test) {
    test.throws(function(){new ReactiveBeaconRegion()});
    test.throws(function(){new ReactiveBeaconRegion({identifier:1, uuid:"123"})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:1})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:1, minor:"123"})});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:"123", minor:1})});
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:123, minor:123}), ReactiveBeaconRegion);
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:123, minor:123}, 1, true)});
    test.throws(function(){new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:123, minor:123}, true, 1)});
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:12, minor:23}, true, true), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:12, minor:23}, false, true), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:12, minor:23}, true, false), ReactiveBeaconRegion);
    test.instanceOf(new ReactiveBeaconRegion({identifier:"123", uuid:"123", major:16, minor:23}, false, false), ReactiveBeaconRegion);
});

// TODO: Test to ensure disable flags don't start ranging / monitoring
// Need spy support or do it via the locationManager stub

/**
 * Test areBeaconsUpdated detecting changes in beacon information
 */
Tinytest.add('ReactiveBeaconRegion._areBeaconsUpdated()', function (test) {
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123"});

    var existingBeacons = [
        {"minor": 13911, "rssi": -65, "major": 22728, "proximity": "ProximityImmediate", "accuracy": 0.12, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"},
        {"minor": 13912, "rssi": -66, "major": 22728, "proximity": "ProximityNear", "accuracy": 0.11, "uuid": "F7826DA6-4FA2-4E98-8024-BC5B71E0893E"}
    ];

    // first test with same beacons
    reactiveBeaconRegion.beaconRegion.beacons = existingBeacons;
    test.isFalse(reactiveBeaconRegion._areBeaconsUpdated(existingBeacons), "Expected beacon comparison to detect same beacons");

    // now test with change to existing beacons and with an additional beacon
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
    test.isTrue(reactiveBeaconRegion._areBeaconsUpdated(differentBeacons), "Expected beacon comparison to detect different beacons");
    test.isTrue(reactiveBeaconRegion._areBeaconsUpdated(additionalBeacons), "Expected beacon comparison to the new beacon");
});


/**
 * Test reactivity on updated beacon monitoring
 */
Tinytest.add('ReactiveBeaconRegion.delegate.didDetermineStateForRegion()', function (test) {
    var inRegion = false;
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123"});
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
Tinytest.add('ReactiveBeaconRegion.delegate.didRangeBeaconsInRegion()', function (test) {
    var computationRanAgain = false;
    var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier:"123", uuid:"123"});
    Tracker.autorun(function(computation) {
        var beaconRegion = reactiveBeaconRegion.getBeaconRegion();
        if (!computation.firstRun) {
            computationRanAgain = true;
        }
    });

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