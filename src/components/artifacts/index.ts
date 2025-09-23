// Artifact framework exports
export { Artifact, ArtifactComponent, useArtifact } from "./artifact";
export { Workspace, WorkspaceProvider, useWorkspace } from "./workspace";
export {
  artifactRegistry,
  getArtifactDefinitions,
  getArtifactDefinition,
  ArtifactRegistry
} from "./registry";

// Import and register chart artifact
import { chartArtifactDefinition } from "./chart-artifact-definition";
import { dashboardArtifactDefinition } from "./dashboard-artifact-definition";
import { artifactRegistry } from "./registry";

// Register artifacts on import
artifactRegistry.register(chartArtifactDefinition);
artifactRegistry.register(dashboardArtifactDefinition);

// Re-export types for convenience
export type {
  BaseArtifact,
  ArtifactKind,
  ChartArtifact,
  ChartArtifactMetadata,
  ChartDataPoint,
  DashboardArtifact,
  DashboardArtifactMetadata,
  DashboardChart,
  DashboardMetric,
  ArtifactStreamPart,
  ArtifactAction,
  ArtifactToolbarAction,
  ArtifactContentProps,
  ArtifactActionContext,
  CreateDocumentRequest,
  UpdateDocumentRequest
} from "../../types/artifacts";