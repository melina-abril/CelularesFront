import { environment } from '../../../environments/environment';

export function apiUrl(path: string): string {
  const base = environment.apiBaseUrl.replace(/\/+$/, '');
  const endpoint = `/${path.replace(/^\/+/, '')}`;
  const apiPrefix = '/api/v1';

  if (base.endsWith(apiPrefix) && (endpoint === apiPrefix || endpoint.startsWith(`${apiPrefix}/`))) {
    return `${base}${endpoint.slice(apiPrefix.length)}`;
  }

  return `${base}${endpoint}`;
}
