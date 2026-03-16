import React from 'react';
import { Stack, Icon } from '@grafana/ui';

export const DefaultContent: React.FC = () => (
  <Stack direction="column" gap={2}>
    <div>Diagrams require at least one node, none have been added.</div>
    <div>
      Update the Diagram in panel options <Icon name="arrow-right" />
    </div>
  </Stack>
);
