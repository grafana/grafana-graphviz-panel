import React from 'react';
import { Box } from '@grafana/ui';

export const CodeModeContent: React.FC = () => (
  <>
    <div>Add a node definition to the DOT diagram source code.</div>
    <Box backgroundColor="secondary" padding={1} borderRadius="default" display="inline-block">
      <code style={{ fontSize: '12px' }}>digraph G &#123; MyNode [label=&quot;My Node&quot;]; &#125;</code>
    </Box>
  </>
);
