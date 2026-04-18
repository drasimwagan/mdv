export type Token = {
  type: string;
  tag: string;
  content: string;
  info: string;
  markup: string;
  children: Token[] | null;
  attrs: Array<[string, string]> | null;
  level: number;
  nesting: -1 | 0 | 1;
  block: boolean;
  hidden: boolean;
};
import type { Row } from "./data.js";

export interface ChartMeta {
  type: "bar" | "line" | "pie";
  opts: Record<string, string | boolean>;
  data: Row[];
}

export interface TableMeta {
  opts: Record<string, string | boolean>;
  data: Row[];
}

export interface ContainerMeta {
  name: string;
}

export interface ErrorMeta {
  severity: "fatal" | "block" | "warning";
  message: string;
  source?: string;
}

export type MdvToken =
  | { kind: "md"; token: Token }
  | { kind: "chart"; meta: ChartMeta }
  | { kind: "table"; meta: TableMeta }
  | { kind: "stat"; meta: TableMeta }
  | { kind: "toc" }
  | { kind: "container-open"; meta: ContainerMeta }
  | { kind: "container-close" }
  | { kind: "error"; meta: ErrorMeta };

export interface MdvDoc {
  frontmatter: Record<string, unknown>;
  tokens: MdvToken[];
  baseDir: string;
}
