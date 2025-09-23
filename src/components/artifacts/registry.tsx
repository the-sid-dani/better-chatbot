import { ArtifactKind } from "app-types/artifacts";
import { Artifact } from "./artifact";

// Artifact registry for managing all artifact definitions
class ArtifactRegistry {
  private artifacts = new Map<ArtifactKind, Artifact<any, any>>();

  register<TKind extends ArtifactKind, TMetadata = Record<string, any>>(
    artifact: Artifact<TKind, TMetadata>
  ): void {
    this.artifacts.set(artifact.kind, artifact);
  }

  get<TKind extends ArtifactKind>(kind: TKind): Artifact<TKind, any> | undefined {
    return this.artifacts.get(kind) as Artifact<TKind, any> | undefined;
  }

  getAll(): Record<ArtifactKind, Artifact<any, any>> {
    const result = {} as Record<ArtifactKind, Artifact<any, any>>;
    for (const [kind, artifact] of this.artifacts.entries()) {
      result[kind] = artifact;
    }
    return result;
  }

  getKinds(): ArtifactKind[] {
    return Array.from(this.artifacts.keys());
  }

  has(kind: ArtifactKind): boolean {
    return this.artifacts.has(kind);
  }

  clear(): void {
    this.artifacts.clear();
  }
}

// Global registry instance
export const artifactRegistry = new ArtifactRegistry();

// Helper function to get artifact definitions
export function getArtifactDefinitions(): Record<ArtifactKind, Artifact<any, any>> {
  return artifactRegistry.getAll();
}

// Helper function to get artifact definition by kind
export function getArtifactDefinition<TKind extends ArtifactKind>(
  kind: TKind
): Artifact<TKind, any> | undefined {
  return artifactRegistry.get(kind);
}

// Export registry for direct access
export { ArtifactRegistry };