
// stub out cordova and plugin
cordova = {
    plugins: {
        locationManager: {
            disableDebugLogs: function(){},
            BeaconRegion: function() {},
            setDelegate: function(delegate) {
                this.delegate = delegate;
            },
            getDelegate: function() {
                return this.delegate;
            },
            requestAlwaysAuthorization: function(){},
            requestWhenInUseAuthorization: function(){},
            startRangingBeaconsInRegion: function() {
                return {
                    fail: function() {
                        return {
                            done: function() {}
                        }
                    }
                }
            },
            startMonitoringForRegion: function() {
                return {
                    fail: function() {
                        return {
                            done: function() {}
                        }
                    }
                }
            },
            Delegate: function() {
                return {};
            }
        }
    }
};
