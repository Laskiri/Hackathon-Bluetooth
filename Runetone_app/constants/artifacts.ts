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
    ble_local_name: 'Artifact Sword',
    detected: false,
  },
  {
    id: 'artifact-2',
    name: 'Ancient Axe',
    description: 'Wooden shield fragment with iron boss and painted runes.',
    ble_local_name: "Artifact Axe",
    detected: false,
  },
  {
    id: 'artifact-3',
    name: 'Viking Sword',
    description: 'A ceremonial sword believed to be from the late Viking age.',
    ble_local_name: 'Artifact Sword',
    detected: false,
  },
  {
    id: 'artifact-4',
    name: 'Ancient Axe',
    description: 'Wooden shield fragment with iron boss and painted runes.',
    ble_local_name: "Artifact Axe",
    detected: false,
  },
  {
    id: 'artifact-5',
    name: 'Ancient Axe',
    description: 'Wooden shield fragment with iron boss and painted runes.',
    ble_local_name: "Artifact Axe",
    detected: false,
  },
];

export default ARTIFACTS;
