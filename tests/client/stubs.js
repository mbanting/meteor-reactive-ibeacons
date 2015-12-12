
// stub out cordova and plugin
cordova = {
    plugins: {
        locationManager: {
            disableDebugLogs: function(){},
            BeaconRegion: function(identifier, uuid, major, minor) {
                return {
                    "uuid": uuid,
                    "major": major,
                    "minor": minor
                };
            },
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
            },
            canAdvertiseStub: false,
            isAdvertisingAvailable: function() {
                const localStub = this.canAdvertiseStub;
                return {
                    then: function(callback) {
                        callback(localStub);
                        return {
                            fail: function() {
                                return {
                                    done: function() {}
                                }
                            }
                        }
                    }
                }
            },
            isAdvertisingStub: false,
            isAdvertising: function() {
                const localStub = this.isAdvertisingStub;
                return {
                    then: function(callback) {
                        callback(localStub);
                        return {
                            fail: function() {
                                return {
                                    done: function() {}
                                }
                            }
                        }
                    }
                }
            },
            startAdvertising: function(beaconRegion) {
                const pluginResult = {
                    region: {
                        uuid: beaconRegion.uuid,
                        major: beaconRegion.major,
                        minor: beaconRegion.minor
                    }
                };
                this.isAdvertisingStub = true;
                this.delegate.peripheralManagerDidStartAdvertising(pluginResult);
                return {
                    fail: function() {
                        return {
                            done: function() {}
                        }
                    }
                }
            }
        }
    }
};
