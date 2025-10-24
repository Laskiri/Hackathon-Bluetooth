export interface Artifact {
  id: string;
  name: string;
  description: string;
  serviceUUID: string;
  detected: boolean;
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'artifact-1',
    name: 'Viking Sword',
    description: 'A ceremonial sword believed to be from the late Viking age.',
    serviceUUID: '00001234-0000-1000-8000-00805f9b34fb',
    detected: false,
  },
  {
    id: 'artifact-2',
    name: 'Ancient Shield',
    description: 'Wooden shield fragment with iron boss and painted runes.',
    serviceUUID: '00005678-0000-1000-8000-00805f9b34fb',
    detected: false,
  },
  {
    id: 'artifact-3',
    name: 'Rune Stone Fragment',
    description: 'Piece of a rune stone containing carved inscriptions.',
    serviceUUID: '00009abc-0000-1000-8000-00805f9b34fb',
    detected: false,
  },
  {
    id: 'artifact-4',
    name: 'Bronze Brooch',
    description: 'Decorative brooch commonly used in Norse garments.',
    serviceUUID: '0000def0-0000-1000-8000-00805f9b34fb',
    detected: false,
  },
];

export default ARTIFACTS;
