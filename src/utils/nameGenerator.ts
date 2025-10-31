function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const orgPrefixes = [
  "Nova", "Quantum", "Apex", "Nimbus", "Vertex", "Summit",
  "Atlas", "Orion", "Zenith", "Horizon", "Pulse", "Elevate",
  "Stellar", "Crescent", "Forge", "Echo", "Element", "Infinitum"
];

const orgSuffixes = [
  "Labs", "Systems", "Solutions", "Technologies", "Dynamics",
  "Innovations", "Ventures", "Industries", "Works", "Collective",
  "Partners", "Global", "Networks"
];

const projectPrefixes = [
  "Project", "Operation", "Mission", "Codename", "Initiative", "Program"
];

const projectCores = [
  "Helix", "Odyssey", "Aurora", "Falcon", "Vertex", "Orion",
  "Pulse", "Neural", "Eclipse", "Momentum", "Phoenix", "Catalyst",
  "Spectrum", "Horizon", "Nova", "Prism", "Axon", "Vector"
];

const projectSuffixes = [
  "AI", "Engine", "Platform", "Suite", "Framework", "OS", "Core", "Cloud"
];

export function generateOrganizationName() {
  const prefix = getRandom(orgPrefixes);
  const suffix = getRandom(orgSuffixes);
  return `${prefix} ${suffix}`;
}

export function generateProjectName() {
  const pattern = Math.floor(Math.random() * 3);
  const prefix = getRandom(projectPrefixes);
  const core = getRandom(projectCores);
  const suffix = getRandom(projectSuffixes);

  switch (pattern) {
    case 0:
      return `${prefix} ${core}`;
    case 1:
      return `${core} ${suffix}`;
    default:
      return `${prefix} ${core} ${suffix}`;
  }
}