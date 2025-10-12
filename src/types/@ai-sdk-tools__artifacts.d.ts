declare module "@ai-sdk-tools/artifacts" {
  import { z } from "zod";

  export interface ArtifactInstance<T> {
    id: string;
    type: string;
    status: string;
    payload: T;
    version: number;
    progress?: number;
    error?: string;
    createdAt: number;
    updatedAt: number;
  }

  export interface ArtifactHandlers<T> {
    create(data?: Partial<T>): ArtifactInstance<T>;
    stream(data?: Partial<T>): unknown;
    validate(data: unknown): T;
    isValid(data: unknown): data is T;
    id: string;
    schema: z.ZodType<T>;
  }

  export function artifact<T>(id: string, schema: z.ZodType<T>): ArtifactHandlers<T>;
}
