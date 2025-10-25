export interface Artifact {
  id: string;
  name: string;
  description: string;
  ble_local_name: string;
  detected: boolean;
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'artifact-1',
    name: 'Viking Sword',
    description: 'A ceremonial sword believed to be from the late Viking age.',
    ble_local_name: 'VikingSword',
    detected: false,
  },
  {
    id: 'artifact-2',
    name: 'Ancient Shield',
    description: 'Wooden shield fragment with iron boss and painted runes.',
    ble_local_name: "AncientShield",
    detected: false,
  },
  {
    id: 'artifact-3',
    name: 'Rune Stone Fragment',
    description: 'Piece of a rune stone containing carved inscriptions.',
    ble_local_name: 'RuneStoneFragment',
    detected: false,
  },
  {
    id: 'artifact-4',
    name: 'Bronze Brooch',
    description: 'Decorative brooch commonly used in Norse garments.',
    ble_local_name: 'BronzeBrooch',
    detected: false,
  },
];

export default ARTIFACTS;
