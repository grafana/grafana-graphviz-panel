import { Graphviz } from '@hpcc-js/wasm';

export interface ValidationErrorInfo {
  lineNumber: number;
  lineContent: string;
}

export interface DotValidationResult {
  isValid: boolean;
  error?: string;
  errorInfo?: ValidationErrorInfo;
}

/**
 * Validates DOT diagram syntax by attempting to parse it with Graphviz.
 * Validates the original user input without transformation, so line numbers
 * in error messages match the user's editor exactly.
 * 
 * @param dotDiagram - The DOT notation string to validate (user's original input)
 * @returns Validation result with error details if invalid
 */
export async function validateDotSyntax(
  dotDiagram: string
): Promise<DotValidationResult> {
  try {
    const graphviz = await Graphviz.load();
    
    graphviz.layout(dotDiagram, 'svg', 'dot');
    
    return { isValid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorInfo = extractValidationErrorInfo(dotDiagram, errorMessage);
    
    return {
      isValid: false,
      error: errorMessage,
      errorInfo,
    };
  }
}

/**
 * Extracts validation error information from the DOT input based on Graphviz error message.
 * Parses the Graphviz error message to find the line number, then extracts that line's content.
 * Graphviz typically formats errors as: "syntax error in line X near 'keyword'"
 * 
 * @param dotDiagram - The DOT notation string
 * @param errorMessage - The error message from Graphviz containing line number
 * @returns Validation error info with line number and content, or undefined if not found
 */
function extractValidationErrorInfo(dotDiagram: string, errorMessage: string): ValidationErrorInfo | undefined {
  const lineMatch = errorMessage.match(/line (\d+)/i);
  if (!lineMatch) {
    return undefined;
  }
  
  const lineNumber = parseInt(lineMatch[1], 10);
  const lines = dotDiagram.split('\n');
  const lineIndex = lineNumber - 1;
  
  if (lineIndex >= 0 && lineIndex < lines.length) {
    return {
      lineNumber,
      lineContent: lines[lineIndex].trim(),
    };
  }
  
  return undefined;
}


