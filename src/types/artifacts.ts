import { DocumentEntity, DocumentVersionEntity } from "../lib/db/pg/schema.pg";

// Base artifact types following Vercel Chat SDK pattern
export type ArtifactKind = "text" | "code" | "image" | "sheet" | "charts" | "dashboard";

export interface BaseArtifact {
  id: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  status: "streaming" | "complete" | "error";
  createdAt: Date;
  updatedAt: Date;
}

// Chart-specific artifact types
export interface ChartDataPoint {
  xAxisLabel: string;
  series: Array<{
    seriesName: string;
    value: number;
  }>;
}

export interface ChartArtifactMetadata {
  chartType: "bar" | "line" | "pie";
  xAxisLabel?: string;
  yAxisLabel?: string;
  description?: string;
  theme?: "light" | "dark";
  colors?: string[];
  animated?: boolean;
}

export interface ChartArtifact extends BaseArtifact {
  kind: "charts";
  data: ChartDataPoint[];
  metadata: ChartArtifactMetadata;
}

// Dashboard-specific artifact types
export interface DashboardChart {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  data: ChartDataPoint[];
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  size?: "small" | "medium" | "large" | "full";
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface DashboardArtifactMetadata {
  chartCount: number;
  metricCount: number;
  chartTypes: string[];
  totalDataPoints: number;
  created: string;
  orchestrationStages?: string[];
}

export interface DashboardArtifact extends BaseArtifact {
  kind: "dashboard";
  charts: DashboardChart[];
  metrics: DashboardMetric[];
  analysis?: string;
  layout: {
    metricsLayout: string;
    chartsLayout: string;
  };
  metadata: DashboardArtifactMetadata;
}

// Streaming data types for real-time updates
export interface ArtifactStreamPart {
  type: "content-update" | "metadata-update" | "chart-data-update" | "status-update";
  content?: string;
  metadata?: Partial<ChartArtifactMetadata>;
  data?: ChartDataPoint[];
  status?: BaseArtifact["status"];
}

// Document management types
export interface CreateDocumentRequest {
  title: string;
  kind: ArtifactKind;
  content?: string;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  documentId: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  description?: string;
}

export interface DocumentWithVersions extends DocumentEntity {
  versions: DocumentVersionEntity[];
  currentVersion?: DocumentVersionEntity;
}

// UI interaction types
export interface ArtifactAction {
  icon: React.ReactNode;
  description: string;
  onClick: (context: ArtifactActionContext) => void;
}

export interface ArtifactActionContext {
  artifact: BaseArtifact;
  appendMessage: (message: { role: "user" | "assistant"; content: string }) => void;
  updateArtifact: (updates: Partial<BaseArtifact>) => void;
}

export interface ArtifactToolbarAction extends ArtifactAction {
  shortcut?: string;
  disabled?: boolean;
}

// Artifact component props
export interface ArtifactContentProps<T extends BaseArtifact = BaseArtifact> {
  artifact: T;
  mode: "view" | "edit" | "diff";
  status: BaseArtifact["status"];
  content: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  onSaveContent: (content: string) => void;
  getDocumentContentById: (versionIndex: number) => string;
  isLoading: boolean;
  metadata?: T extends ChartArtifact ? ChartArtifactMetadata : Record<string, any>;
}

// Charts-specific tool types
export interface CreateChartToolArgs {
  title: string;
  chartType: ChartArtifactMetadata["chartType"];
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  description?: string;
}

export interface UpdateChartToolArgs {
  documentId: string;
  data?: ChartDataPoint[];
  metadata?: Partial<ChartArtifactMetadata>;
  description?: string;
}

// Repository interfaces
export interface DocumentRepository {
  createDocument(userId: string, data: CreateDocumentRequest): Promise<DocumentEntity>;
  updateDocument(documentId: string, userId: string, data: Partial<DocumentEntity>): Promise<DocumentEntity>;
  deleteDocument(documentId: string, userId: string): Promise<void>;
  getDocument(documentId: string, userId: string): Promise<DocumentEntity | null>;
  getUserDocuments(userId: string, kind?: ArtifactKind): Promise<DocumentEntity[]>;
  createVersion(documentId: string, content: string, metadata?: Record<string, any>): Promise<DocumentVersionEntity>;
  getDocumentVersions(documentId: string): Promise<DocumentVersionEntity[]>;
}

// Server handler types
export interface DocumentHandler<TKind extends ArtifactKind = ArtifactKind> {
  kind: TKind;
  onCreateDocument: (params: {
    title: string;
    dataStream: any; // UIMessageStreamWriter
    userId: string;
    metadata?: Record<string, any>;
  }) => Promise<string>;
  onUpdateDocument: (params: {
    document: DocumentEntity;
    description: string;
    dataStream: any; // UIMessageStreamWriter
    userId: string;
    metadata?: Record<string, any>;
  }) => Promise<string>;
}

// Chart generation prompts and templates
export interface ChartGenerationContext {
  userRequest: string;
  existingData?: ChartDataPoint[];
  chartType?: ChartArtifactMetadata["chartType"];
  preferredFormat?: "json" | "csv" | "array";
}

export interface ChartStreamingUpdate {
  type: "chart-data-point" | "chart-metadata" | "chart-complete";
  data?: ChartDataPoint;
  metadata?: Partial<ChartArtifactMetadata>;
  isComplete?: boolean;
}

// Error types
export interface ArtifactErrorInterface {
  type: "validation" | "generation" | "streaming" | "database";
  message: string;
  details?: Record<string, any>;
}

export class ArtifactError extends Error implements ArtifactErrorInterface {
  public readonly type: "validation" | "generation" | "streaming" | "database";
  public readonly details?: Record<string, any>;

  constructor(
    type: "validation" | "generation" | "streaming" | "database",
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "ArtifactError";
    this.type = type;
    this.details = details;
  }
}

// Export artifact kind constants
export const ARTIFACT_KINDS: readonly ArtifactKind[] = ["text", "code", "image", "sheet", "charts", "dashboard"] as const;

export const CHART_TYPES: readonly ChartArtifactMetadata["chartType"][] = ["bar", "line", "pie"] as const;

// Type guards
export function isChartArtifact(artifact: BaseArtifact): artifact is ChartArtifact {
  return artifact.kind === "charts";
}

export function isDashboardArtifact(artifact: BaseArtifact): artifact is DashboardArtifact {
  return artifact.kind === "dashboard";
}

export function isChartStreamPart(part: ArtifactStreamPart): part is ArtifactStreamPart & { type: "chart-data-update" } {
  return part.type === "chart-data-update";
}

// Utility types
export type ArtifactByKind<K extends ArtifactKind> = K extends "charts"
  ? ChartArtifact
  : K extends "dashboard"
  ? DashboardArtifact
  : BaseArtifact;

export type ArtifactMetadataByKind<K extends ArtifactKind> = K extends "charts"
  ? ChartArtifactMetadata
  : K extends "dashboard"
  ? DashboardArtifactMetadata
  : Record<string, any>;