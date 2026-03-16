import React, { ReactNode } from 'react';
import { Stack, Alert, Box } from '@grafana/ui';

interface EmptyStateAlertProps {
  children?: ReactNode;
}

export const EmptyStateAlert: React.FC<EmptyStateAlertProps> = ({ children }) => (
  <Box padding={2}>
    <Stack direction="row" justifyContent="center">
      <Box width="600px">
        <Alert title="This diagram is empty!" severity="info">
          {children}
        </Alert>
      </Box>
    </Stack>
  </Box>
);
