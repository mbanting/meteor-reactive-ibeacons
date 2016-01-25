# mbanting:reactive-ibeacons

Turns [Apple iBeacons](https://developer.apple.com/ibeacon/) into reactive data sources in your Meteor Cordova apps. 

## Installation

```
    meteor add mbanting:reactive-ibeacons
```

## Description

Hardware can be reactive data sources too!

iBeacons are Bluetooth Low Energy (BLE) hardware devices that enable new location awareness [possibilities](http://blog.mowowstudios.com/2015/02/100-use-cases-examples-ibeacon-technology/) for apps. They can be used to establish a region around an object or location, allowing your Meteor Cordova app to determine when it has entered or left the region (also known as Monitoring), along with an estimation of proximity to a beacon (also known as Ranging). This package turns iBeacons into reactive data sources in your Meteor Cordova app, providing an easy way for you to handle these proximity-related events.


## Compatibility
This package builds on top Peter Metz's [Cordova iBeacon plugin](https://github.com/petermetz/cordova-plugin-ibeacon), and is therefore compatible with iOS 7+ (using its Core Location framework) and Android (using the [AltBeacon's](http://altbeacon.org/) Android implementation). 

## Usage
iBeacons broadcast self-contained packets of data in set intervals for detection by your app, allowing your app to know when a user is in the vicinity of a beacon. To understand how to use this package, you need to have some basic understanding of how iBeacons work.

### iBeacon Basics
iBeacons regularly broadcast a signal for your app to detect. Included in this signal is the identifier of the iBeacon, and additional proximity information. 

Every iBeacon is designated and broadcasts an identifier composed of
- `uuid`: 16 byte identifier, usually expressed as a series of hexadecimal digits separated by dashes, used to differentiate a large group of related beacons.  
- `major`:  Integer between 0 and 65535, usually used to group a subset of the larger group. 
- `minor`: Integer between 0 and 65535, usually used to identify an individual beacon 

How you organize and designate these values for your iBeacons is up to you. One suggested approach is to set the `UUID` to the same value for all iBeacons that you want your app to detect. This is because apps can't just detect every iBeacon that is out there. You need to specify which iBeacons it should pick up by specifying the beacon region.

### Beacon Region
The first step is to instantiate a `ReactiveBeaconRegion` object by specifying the beacon region, effectively telling your app what beacons to detect. This includes an arbitrary `identifier` label value  and the `uuid` (in a string form of 32 hexadecimal digits, split into 5 groups, separated by dashes). This will allow your app to detect all iBeacons with the specified `uuid`, regardless of its `major` or `minor` value. 
```
var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier: "beacons on shelf", uuid: "F7826DA1-4FA2-4E97-8022-BC5B71E0893A"});
```
You can optionally specify the `major` value if you want to narrow your beacon region further to a smaller subset of beacons. You can even specify the `minor` value to narrow it to a single beacon altogether.  
```
var reactiveBeaconRegion = new ReactiveBeaconRegion({identifier: "beacons on shelf", uuid: "F7826DA1-4FA2-4E97-8022-BC5B71E0893A", "major":5, "minor":26});
```

### Beacon Data
Once you've instantiated your `ReactiveBeaconRegion` you can make the following call to get the proximity information for the beacon region. 

```
var beaconRegion = reactiveBeaconRegion.getBeaconRegion();
```

If beacons are detected, this function returns a data structure similar to the following:
```
{
    "identifier": "beacons on shelf",
    "uuid": "F7826DA1-4FA2-4E97-8022-BC5B71E0893A",
    "beacons": [
        {
            "minor": 25,
            "rssi": -65,
            "major": 5,
            "proximity": "ProximityImmediate",
            "accuracy": 0.10,
            "uuid": "F7826DA1-4FA2-4E97-8022-BC5B71E0893A"
        },
        {
            "minor": 26,
            "rssi": -65,
            "major": 5,
            "proximity": "ProximityNear",
            "accuracy": 0.12,
            "uuid": "F7826DA1-4FA2-4E97-8022-BC5B71E0893A"
        }
    ],
    "inRegion": true
}
```
The properties are:
- `identifier`: The identifier you used when creating this `ReactiveBeaconRegion`
- `uuid`: The `uuid` of the beacons being detected by this `ReactiveBeaconRegion`
- `major`: If passed in when instantiating the `ReactiveBeaconRegion`, the `major` id of the beacons being detected 
- `minor`: If passed in when instantiating the `ReactiveBeaconRegion`, the `minor` id of the beacons being detected 
- `beacons`: An array of beacon information for all currently ranged beacons. Ordered with the closest beacon at the beginning of the array
  - `uuid`: The UUID of the beacon
  - `major`: The major ID of the beacon
  - `minor`: The minor ID of the beacon
  - `proximity`: The relative distance to the beacon, one of "ProximityImmediate", "ProximityNear", "ProximityFar"
  - `accuracy`: The accuracy of the proximity value, measured in meters from the beacon.
  - `rssi`: The received signal strength of the beacon, measured in decibels.
- `inRegion`: true if device crossed into the monitored region, false if the deviced crossed outside the monitored region, null if unknown 

### Reactivity
Being a reactive data source, you can use this reactively and respond appropriately to proximity changes.
```
        Tracker.autorun(function () {
            if (reactiveBeaconRegion.getBeaconRegion().inRegion) {
                // popup message welcoming user to the neighborhood!
            }
        });
```

## Permissions
Having your app detect iBeacons requires it to have access to your user's location. Creating a `ReactiveBeaconRegion` will trigger  your app to request for this permission, if it doesn't have this privilege already. 

## Background Monitoring
As mentioned above, detecting and gathering iBeacon data is done via a combination of _monitoring_ and _ranging_. Monitoring a region enables your app to know when a device enters or exits the range of beacons defined by the region, updating the `inRegion` property. Ranging is more granular. It updates the list of beacons and their information in the `beacons` array. Ranging works only when the user is actively using your application (the app is in the foreground). However, monitoring works even if the app is asleep in the background. iOS and Android will wake up your app and give it a short amount of time (5-10 seconds) to handle the event with code that doesn't require a UI (for example updating application state, calling a web service, or sending a local notification). 

## Advertising
You can also have the device advertise itself as a beacon. Currently advertising is only supported on iOS. To check whether your device supports advertising:
```
reactiveBeaconRegion.canAdvertise( function(result) {
    if (result) console.log("Hot dog, we can advertise!");
});
```

To find out if you're already advertising:
```
reactiveBeaconRegion.isAdvertising( function(result) {
    if (result) console.log("Advertising now.");
});
```

To start advertising:
```
reactiveBeaconRegion.startAdvertising(
    "4493DE05-A461-406E-9CC0-C3EEF370C94F", //uuid
    "Liam's Beacon", //identifier
    1000, //major
    2000, //minor
    // callback called when advertising actually starts
    function(pluginResult) {
        console.log(JSON.stringify(pluginResult.region));
    },
    // callback called when device state changes
    function(pluginResult) {
        console.log(pluginResult.state);
    }
);
```

To stop advertising:
```
advertiser.stopAdvertising();
```


## Limitations
- As with any functionality relying on Cordova, this will only work after Meteor has started. You can wrap your `ReactiveBeaconRegion` constructor call in a `Meteor.startup()` function to make sure this happens.
- iOS actually allows you to define up to 20 different regions. Unfortunately, due to a [limitation](https://github.com/petermetz/cordova-plugin-ibeacon/issues/166) with the underlying plugin, only one beacon region can be monitored and ranged at any given time. Possible workarounds are under investigation.

## Testing

This package has been tested extensively on iOS, and on a limited basis on Android. Any help testing on Android is much appreciated! 

To run this package's unit tests (implemented with TinyTest), type the following:

```
meteor test-packages ./
```
## Contributions
- [@mrlowe](https://github.com/mrlowe): added Advertising functionality

## Feedback
If you have any problems, questions, or have general feedback, please feel free to contact me!

## License
The code for this package is licensed under the [MIT License](http://opensource.org/licenses/MIT).
