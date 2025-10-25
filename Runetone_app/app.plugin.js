const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

function addAndroidPermissions(androidManifest, options) {
  const usesPermissions = androidManifest.manifest['uses-permission'] || [];

  const permsToAdd = [
    'android.permission.BLUETOOTH',
    'android.permission.BLUETOOTH_ADMIN',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.ACCESS_FINE_LOCATION'
  ];

  permsToAdd.forEach(perm => {
    if (!usesPermissions.find(p => p['$']['android:name'] === perm)) {
      usesPermissions.push({ $: { 'android:name': perm } });
    }
  });

  androidManifest.manifest['uses-permission'] = usesPermissions;

  // add uses-feature for bluetooth LE
  const application = androidManifest.manifest['application'] || [];
  const usesFeatures = androidManifest.manifest['uses-feature'] || [];
  if (!usesFeatures.find(f => f['$'] && f['$']['android:name'] === 'android.hardware.bluetooth_le')) {
    usesFeatures.push({ $: { 'android:name': 'android.hardware.bluetooth_le', 'android:required': 'false' } });
  }

  androidManifest.manifest['uses-feature'] = usesFeatures;
  return androidManifest;
}

const withBleConfig = (config, props) => {
  const options = props || {};

  config = withAndroidManifest(config, config2 => {
    config2.modResults = addAndroidPermissions(config2.modResults, options);
    return config2;
  });

  config = withInfoPlist(config, config2 => {
    const NSBluetoothAlwaysUsageDescription = options.bluetoothAlwaysPermission || 'Allow the app to use Bluetooth';
    config2.modResults = config2.modResults || {};
    config2.modResults.NSBluetoothAlwaysUsageDescription = NSBluetoothAlwaysUsageDescription;
    config2.modResults.NSBluetoothPeripheralUsageDescription = NSBluetoothAlwaysUsageDescription;
    return config2;
  });

  return config;
};

module.exports = withBleConfig;
