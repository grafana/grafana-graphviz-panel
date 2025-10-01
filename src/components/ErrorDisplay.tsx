import React from 'react';
import { Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { ValidationErrorInfo } from '../validation';

interface ErrorDisplayProps {
  errorMessage: string;
  errorInfo?: ValidationErrorInfo;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage, errorInfo }) => {
  const codeStyle = css`
    display: block;
    margin-top: 8px;
    font-family: monospace;
    font-size: 0.9em;
  `;

  return (
    <Alert severity="error" title="Invalid DOT diagram definition, please fix:">
      <dl style={{ marginLeft: '16px', marginTop: '8px' }}>
        <dt>{errorMessage}</dt>
        {errorInfo && (
          <dd>
            <code className={codeStyle}>
              {errorInfo.lineNumber}: {errorInfo.lineContent}
            </code>
          </dd>
        )}
      </dl>
    </Alert>
  );
};

