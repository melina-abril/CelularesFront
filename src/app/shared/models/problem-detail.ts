export interface ProblemDetail {
  title: string;
  status: number;
  detail: string;
  code: string;
  errors: Record<string, string[]>;
}
