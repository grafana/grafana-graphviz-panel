const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;
const INTERPOLATION_REGEX = /\$\{([^}]+)\}/g;

function escapeHtml(text: string): string {
  return text.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

function escapeBackslashes(value: string): string {
  return value.replace(/\\/g, '\\\\');
}

function escapeDoubleQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}

function escapeNewlines(value: string): string {
  return value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

export function escapeDotLabel(value: string): string {
  if (typeof value !== 'string') {
    value = String(value);
  }

  const withBackslashes = escapeBackslashes(value);
  const withQuotes = escapeDoubleQuotes(withBackslashes);
  const withNewlines = escapeNewlines(withQuotes);
  const withHtmlEscapes = escapeHtml(withNewlines);

  return withHtmlEscapes;
}

function replaceFieldReference(fieldName: string, dataRow: Record<string, any>): string {
  const value = dataRow[fieldName];

  if (value == null) {
    return '';
  }

  return escapeDotLabel(value);
}

export function interpolateLabel(labelTemplate: string, dataRow: Record<string, any>): string {
  return labelTemplate.replace(INTERPOLATION_REGEX, (_match, fieldName) => replaceFieldReference(fieldName, dataRow));
}

export function interpolateLabelWithVariables(
  labelTemplate: string,
  dataRow: Record<string, any>,
  replaceVariables?: (value: string) => string
): string {
  let result = labelTemplate;

  if (replaceVariables) {
    result = replaceVariables(result);
  }

  result = result.replace(INTERPOLATION_REGEX, (_match, fieldName) => replaceFieldReference(fieldName, dataRow));

  return result;
}

export function hasInterpolation(label: string | undefined): boolean {
  if (!label) {
    return false;
  }
  INTERPOLATION_REGEX.lastIndex = 0;
  return INTERPOLATION_REGEX.test(label);
}

export function extractFieldReferences(labelTemplate: string): string[] {
  INTERPOLATION_REGEX.lastIndex = 0;
  const matches = labelTemplate.matchAll(INTERPOLATION_REGEX);
  return Array.from(matches, (m) => m[1]);
}

export function interpolateLabelIfNeeded(
  label: string | undefined,
  dataRow: Record<string, any>,
  replaceVariables?: (value: string) => string
): string | undefined {
  if (!label || !hasInterpolation(label)) {
    return label;
  }
  return interpolateLabelWithVariables(label, dataRow, replaceVariables);
}
