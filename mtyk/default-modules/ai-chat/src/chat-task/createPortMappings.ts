

interface PortMap {
  [containerPort: number]: number;
}

type DockerPortBinding = {
  HostIP: string;
  HostPort: string;
}

interface PortBindings {
  [portKey: string]: DockerPortBinding[];
}

interface PortMappingsConfig {
  // ExposedPorts: PortBindings;
  HostConfig: {
    PortBindings: PortBindings;
  };
}

/**
 * Creates the port mappings configuration for Docker containers.
 *
 * @param {PortMap} portMap - The mapping of container ports to host ports.
 * @returns {PortMappingsConfig} - The port mappings configuration.
 *
 * @example
 * // Example 1: Map container port 80 to host port 8080
 * const portMap1 = {
 *   80: 8080,
 * };
 */
export function createPortMappingsConfig(portMap: PortMap): PortMappingsConfig {
  const portBindings: PortBindings = {};

  Object.entries(portMap).forEach(([containerPort, hostPort]) => {
    const portKey = `${containerPort}/tcp`;
    portBindings[portKey] = [{ HostIP: '0.0.0.0', HostPort: String(hostPort) }];
  });

  return {
    // ExposedPorts: portBindings,
    HostConfig: { PortBindings: portBindings },
  };
}
