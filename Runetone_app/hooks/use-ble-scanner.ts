import { useEffect, useRef, useState } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import ARTIFACTS, { Artifact } from '@/constants/artifacts';

type UseBleScannerReturn = {
  detectedArtifacts: Artifact[];
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
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean>(Platform.OS !== 'android');
  const [error, setError] = useState<string | null>(null);
  const [nativeAvailable, setNativeAvailable] = useState<boolean>(true);

  async function requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const permissionsToRequest: any[] = [];
      const scan = PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN;
      const connect = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;

      if (scan) permissionsToRequest.push(scan);
      if (connect) permissionsToRequest.push(connect);

      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const allGranted = Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
      setHasPermission(allGranted);
      return allGranted;
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setHasPermission(false);
      return false;
    }
  }

  async function startScanning() {
    setError(null);
    if (!managerRef.current) {
      // try to initialize BleManager lazily and guard against missing native module
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

      managerRef.current.startDeviceScan(null, null, (err: any, scannedDevice: Device | null) => {
        if (err) {
          setError(err.message ?? String(err));
          setIsScanning(false);
          return;
        }

        if (!scannedDevice) return;

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
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setIsScanning(false);
    }
  }

  function stopScanning() {
    try {
      managerRef.current?.stopDeviceScan();
    } catch (e: any) {
      // ignore
    }
    setIsScanning(false);
  }

  useEffect(() => {
    // Initialize BleManager once on mount if platform seems supported. Wrap in try/catch
    if (Platform.OS === 'web') {
      setNativeAvailable(false);
      setError('Bluetooth LE is not supported on web in this build.');
      return;
    }

    try {
      managerRef.current = new BleManager();
      setNativeAvailable(true);
    } catch {
      // Typical when running inside Expo Go without native BLE module
      setNativeAvailable(false);
      setError(
        'Native BLE module not available. Use an Expo dev client or prebuilt app that includes react-native-ble-plx.'
      );
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
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allArtifactsDetected = ARTIFACTS.every(a => detectedArtifacts.some(d => d.id === a.id));

  // If native module is missing, provide a helpful error in the returned state
  useEffect(() => {
    if (!nativeAvailable && !error) {
      setError('Native BLE module not available in this build.');
    }
  }, [nativeAvailable, error]);

  return {
    detectedArtifacts,
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
    allArtifactsDetected,
  };
}
