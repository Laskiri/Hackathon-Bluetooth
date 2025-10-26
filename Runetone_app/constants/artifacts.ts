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
    description: 'A blade like this was never meant for common hands. Its edge carried honor, its hilt the weight of generations who fought for glory and name',
    ble_local_name: 'Artifact Sword',
    detected: false,
  },
  {
    id: 'artifact-2',
    name: 'Artifact Axe',
    description: 'The roar still hums with whispers of old battles. Symbols etched into its steel once carried the faith and fury of a Viking’s soul',
    ble_local_name: "Artifact Axe",
    detected: false,
  },
  {
    id: 'artifact-3',
    name: 'Artifact Cross',
    description: 'A symbol of faith born in a time of doubt. It carried the promise of new beginnings — when old gods faded and new light touched the North',
    ble_local_name: "Artifact Cross",
    detected: false,
  },
];

export default ARTIFACTS;
