import { useEffect, useRef, useState } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { ARTIFACTS, Artifact } from '@/constants/artifacts';

type ScannedDevice = {
  id: string;
  name?: string | null;
  rssi?: number | null;
  serviceUUIDs?: string[] | null;
};

type UseBleScannerReturn = {
  detectedArtifacts: Artifact[];
  scannedDevices: ScannedDevice[];
  isScanning: boolean;
  hasPermission: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  allArtifactsDetected: boolean;
};

export default function useBleScanner(): UseBleScannerReturn {
  const managerRef = useRef<BleManager | null>(null);
  const [detectedArtifacts, setDetectedArtifacts] = useState<Artifact[]>([]);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean>(Platform.OS !== 'android');
  const [error, setError] = useState<string | null>(null);
  const [nativeAvailable, setNativeAvailable] = useState<boolean>(true);

  const simulationIntervalRef = useRef<number | null>(null);
  const simulationIndexRef = useRef<number>(0);

  async function requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const permissionsToRequest: any[] = [];
      const scan = PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN;
      const connect = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
      const fineLocation = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

      // Request BLE-specific permissions (Android 12+) and fine location (older Androids / fallback)
      if (scan) permissionsToRequest.push(scan);
      if (connect) permissionsToRequest.push(connect);
      if (fineLocation) permissionsToRequest.push(fineLocation);

      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest as any);

      const allGranted = Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
      setHasPermission(allGranted);
      if (__DEV__) {
        // helpful debug output when developing
        console.debug('[useBleScanner] requested permissions ->', granted, 'allGranted=', allGranted);
      }
      return allGranted;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setHasPermission(false);
      return false;
    }
  }

  async function startScanning() {
    setError(null);
    // lazy init
    if (!managerRef.current) {
      if (Platform.OS === 'web') {
        setError('Bluetooth LE is not supported on web in this build.');
        setNativeAvailable(false);
        return;
      }
      try {
        managerRef.current = new BleManager();
        setNativeAvailable(true);
      } catch {
        setError(
          'Native BLE module not available. Make sure you are running a development build or prebuilt app that includes react-native-ble-plx.'
        );
        setNativeAvailable(false);
        return;
      }
    }

    try {
      if (!hasPermission) {
        const ok = await requestBluetoothPermissions();
        if (!ok) {
          setError('Bluetooth permissions not granted');
          return;
        }
      }

      setIsScanning(true);

      if (__DEV__) {
        console.debug('[useBleScanner] startScanning called, nativeAvailable=', nativeAvailable, 'hasPermission=', hasPermission);
      }

      managerRef.current.startDeviceScan(null, null, (err: any, scannedDevice: Device | null) => {
        if (err) {
          setError(err?.message ?? String(err));
          setIsScanning(false);
          return;
        }

        if (!scannedDevice) return;

        // upsert scanned device
        setScannedDevices(prev => {
          const exists = prev.find(d => d.id === scannedDevice.id);
          const entry: ScannedDevice = {
            id: scannedDevice.id,
            name: scannedDevice.name ?? (scannedDevice.localName as string | undefined) ?? null,
            rssi: (scannedDevice.rssi as number) ?? null,
            serviceUUIDs: (scannedDevice.serviceUUIDs as string[] | null) ?? null,
          };
          if (exists) return prev.map(d => (d.id === entry.id ? { ...d, ...entry } : d));
          return [...prev, entry];
        });

        // Check device service UUIDs for artifact matches
        const serviceUUIDs = (scannedDevice.serviceUUIDs || []) as string[];

        ARTIFACTS.forEach(artifact => {
          if (serviceUUIDs.find(u => u?.toLowerCase() === artifact.serviceUUID.toLowerCase())) {
            setDetectedArtifacts(prev => {
              const exists = prev.find(p => p.id === artifact.id);
              if (exists) return prev;
              return [...prev, { ...artifact, detected: true }];
            });
          }
        });
      });
      return;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setIsScanning(false);
    }

    // If native module isn't available, provide a dev-mode simulation so the UI can be tested in Expo Go
    if (!nativeAvailable) {
      if (__DEV__) {
        setIsScanning(true);
        // reset simulation state
        simulationIndexRef.current = 0;
        setDetectedArtifacts([]);
        setScannedDevices([]);
        simulationIntervalRef.current = setInterval(() => {
          const idx = simulationIndexRef.current;
          if (idx >= ARTIFACTS.length) {
            if (simulationIntervalRef.current != null) {
              clearInterval(simulationIntervalRef.current as any);
              simulationIntervalRef.current = null;
            }
            setIsScanning(false);
            return;
          }
          const artifact = ARTIFACTS[idx];
          setDetectedArtifacts(prev => {
            const exists = prev.find(p => p.id === artifact.id);
            if (exists) return prev;
            return [...prev, { ...artifact, detected: true }];
          });
          // also add a simulated nearby device entry for testing
          setScannedDevices(prev => {
            const id = `sim-${artifact.id}`;
            const exists = prev.find(p => p.id === id);
            const entry: ScannedDevice = { id, name: `${artifact.name} (sim)`, rssi: -50 - idx * 5, serviceUUIDs: [artifact.serviceUUID] };
            if (exists) return prev.map(d => (d.id === id ? { ...d, ...entry } : d));
            return [...prev, entry];
          });
          simulationIndexRef.current = idx + 1;
        }, 1500) as unknown as number;
      } else {
        setError('Native BLE module not available in this build.');
      }
    }
  }

  function stopScanning() {
    try {
      managerRef.current?.stopDeviceScan();
    } catch {
      // ignore
    }
    // clear any simulation timer
    if (simulationIntervalRef.current != null) {
      clearInterval(simulationIntervalRef.current as any);
      simulationIntervalRef.current = null;
    }
    setIsScanning(false);
  }

  useEffect(() => {
    // Initialize manager if possible
    if (Platform.OS === 'web') {
      setNativeAvailable(false);
      setError('Bluetooth LE is not supported on web in this build.');
      return;
    }

    try {
      managerRef.current = new BleManager();
      setNativeAvailable(true);
    } catch {
      setNativeAvailable(false);
      setError('Native BLE module not available. Use an Expo dev client or prebuilt app that includes react-native-ble-plx.');
    }

    return () => {
      try {
        managerRef.current?.stopDeviceScan();
        // destroy if available
        // @ts-ignore
        if (managerRef.current?.destroy) managerRef.current.destroy();
      } catch {
        // ignore
      }
      // clear simulation timer on unmount
      if (simulationIntervalRef.current != null) {
        clearInterval(simulationIntervalRef.current as any);
        simulationIntervalRef.current = null;
      }
      managerRef.current = null;
    };
  }, []);

  const allArtifactsDetected = ARTIFACTS.every(a => detectedArtifacts.some(d => d.id === a.id));

  // If native module is missing, provide a helpful error in the returned state
  useEffect(() => {
    if (!nativeAvailable && !error) {
        setError(
            `Native BLE module not available in this build. nativeAvailable=${nativeAvailable} error=${error ? 'present' : 'none'}`
        );
    }
  }, [nativeAvailable, error]);

  return {
    detectedArtifacts,
    scannedDevices,
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
    allArtifactsDetected,
  };
}
