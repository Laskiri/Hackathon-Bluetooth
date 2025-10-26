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
    name: 'Artifact Sword',
    description: 'A ceremonial sword believed to be from the late Viking age.',
    ble_local_name: 'Artifact Sword',
    detected: false,
  },
  {
    id: 'artifact-2',
    name: 'Artifact Axe',
    description: 'An axe that has stood the test of time',
    ble_local_name: "Artifact Axe",
    detected: false,
  },
  {
    id: 'artifact-3',
    name: 'Artifact Cross',
    description: 'An axe that has stood the test of time',
    ble_local_name: "Artifact Cross",
    detected: false,
  },
];

export default ARTIFACTS;
