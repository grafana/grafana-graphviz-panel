import {
  escapeDotLabel,
  interpolateLabel,
  interpolateLabelWithVariables,
  hasInterpolation,
  extractFieldReferences,
  interpolateLabelIfNeeded,
  resolveTemplate,
  resolveDataLinks,
} from './interpolation';

describe('interpolation', () => {
  describe('escapeDotLabel', () => {
    const testCases = [
      {
        name: 'should escape backslashes',
        input: 'hello\\world',
        expected: 'hello\\\\world',
      },
      {
        name: 'should escape double quotes with HTML escaping',
        input: 'hello"world',
        expected: 'hello\\&quot;world',
      },
      {
        name: 'should escape newlines',
        input: 'hello\nworld',
        expected: 'hello\\nworld',
      },
      {
        name: 'should escape carriage returns',
        input: 'hello\rworld',
        expected: 'hello\\rworld',
      },
      {
        name: 'should escape HTML ampersands',
        input: 'hello&world',
        expected: 'hello&amp;world',
      },
      {
        name: 'should escape HTML less than',
        input: 'hello<world',
        expected: 'hello&lt;world',
      },
      {
        name: 'should escape HTML greater than',
        input: 'hello>world',
        expected: 'hello&gt;world',
      },
      {
        name: 'should escape HTML single quotes',
        input: "hello'world",
        expected: 'hello&#39;world',
      },
      {
        name: 'should escape all special characters together',
        input: 'hello&<>"\'\\world\ntest',
        expected: 'hello&amp;&lt;&gt;\\&quot;&#39;\\\\world\\ntest',
      },
      {
        name: 'should handle empty string',
        input: '',
        expected: '',
      },
      {
        name: 'should handle plain text without special characters',
        input: 'hello world',
        expected: 'hello world',
      },
      {
        name: 'should convert non-string values to string',
        input: 123 as any,
        expected: '123',
      },
      {
        name: 'should convert null to string',
        input: null as any,
        expected: 'null',
      },
      {
        name: 'should convert undefined to string',
        input: undefined as any,
        expected: 'undefined',
      },
      {
        name: 'should escape in correct order (backslashes first)',
        input: '\\n',
        expected: '\\\\n',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(escapeDotLabel(input)).toBe(expected);
      });
    });
  });

  describe('interpolateLabel', () => {
    const testCases = [
      {
        name: 'should replace single field reference',
        template: 'Hello ${name}',
        dataRow: { name: 'World' },
        expected: 'Hello World',
      },
      {
        name: 'should replace multiple field references',
        template: '${first} ${last}',
        dataRow: { first: 'John', last: 'Doe' },
        expected: 'John Doe',
      },
      {
        name: 'should replace same field multiple times',
        template: '${x} + ${x} = ${result}',
        dataRow: { x: '5', result: '10' },
        expected: '5 + 5 = 10',
      },
      {
        name: 'should return empty string for undefined field',
        template: 'Hello ${missing}',
        dataRow: {},
        expected: 'Hello ',
      },
      {
        name: 'should return empty string for null field value',
        template: 'Hello ${name}',
        dataRow: { name: null },
        expected: 'Hello ',
      },
      {
        name: 'should escape special characters in field values',
        template: '${value}',
        dataRow: { value: 'hello"world' },
        expected: 'hello\\&quot;world',
      },
      {
        name: 'should handle template with no interpolations',
        template: 'Just plain text',
        dataRow: { name: 'John' },
        expected: 'Just plain text',
      },
      {
        name: 'should handle empty template',
        template: '',
        dataRow: { name: 'John' },
        expected: '',
      },
      {
        name: 'should handle numeric field values',
        template: 'Count: ${count}',
        dataRow: { count: 42 },
        expected: 'Count: 42',
      },
      {
        name: 'should handle boolean field values',
        template: 'Active: ${active}',
        dataRow: { active: true },
        expected: 'Active: true',
      },
      {
        name: 'should handle field names with underscores',
        template: '${user_name}',
        dataRow: { user_name: 'john_doe' },
        expected: 'john_doe',
      },
      {
        name: 'should handle field names with numbers',
        template: '${field1}',
        dataRow: { field1: 'value1' },
        expected: 'value1',
      },
    ];

    testCases.forEach(({ name, template, dataRow, expected }) => {
      it(name, () => {
        expect(interpolateLabel(template, dataRow)).toBe(expected);
      });
    });
  });

  describe('hasInterpolation', () => {
    const testCases = [
      {
        name: 'should return true for single field reference',
        input: 'Hello ${name}',
        expected: true,
      },
      {
        name: 'should return true for multiple field references',
        input: '${first} ${last}',
        expected: true,
      },
      {
        name: 'should return false for no interpolations',
        input: 'Just plain text',
        expected: false,
      },
      {
        name: 'should return false for empty string',
        input: '',
        expected: false,
      },
      {
        name: 'should return false for undefined input',
        input: undefined,
        expected: false,
      },
      {
        name: 'should return false for malformed interpolation (no closing brace)',
        input: 'Hello ${name',
        expected: false,
      },
      {
        name: 'should return false for malformed interpolation (no opening brace)',
        input: 'Hello $name}',
        expected: false,
      },
      {
        name: 'should return true for field with underscores',
        input: '${user_name}',
        expected: true,
      },
      {
        name: 'should return true for field with numbers',
        input: '${field1}',
        expected: true,
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(hasInterpolation(input)).toBe(expected);
      });
    });
  });

  describe('interpolateLabelWithVariables', () => {
    const testCases = [
      {
        name: 'should apply dashboard variables before field interpolation',
        template: 'Environment: $environment, Server: ${server}',
        dataRow: { server: 'web-01' },
        replaceVariables: (str: string) => str.replace('$environment', 'production'),
        expected: 'Environment: production, Server: web-01',
      },
      {
        name: 'should handle ${variable} syntax for dashboard variables',
        template: 'Env: ${environment}, Node: ${node}',
        dataRow: { node: 'node-1' },
        replaceVariables: (str: string) => str.replace('${environment}', 'staging'),
        expected: 'Env: staging, Node: node-1',
      },
      {
        name: 'should work without replaceVariables function',
        template: 'Server: ${server}, Port: ${port}',
        dataRow: { server: 'web-01', port: 8080 },
        replaceVariables: undefined,
        expected: 'Server: web-01, Port: 8080',
      },
      {
        name: 'should handle multiple dashboard variables',
        template: '$env-$region: ${status}',
        dataRow: { status: 'healthy' },
        replaceVariables: (str: string) => str.replace('$env', 'prod').replace('$region', 'us-east'),
        expected: 'prod-us-east: healthy',
      },
      {
        name: 'should not double-escape characters from dashboard variables',
        template: '$var with "quotes": ${field}',
        dataRow: { field: 'value' },
        replaceVariables: (str: string) => str.replace('$var', 'test'),
        expected: 'test with "quotes": value',
      },
      {
        name: 'should handle empty data row',
        template: 'Prefix $var ${missing}',
        dataRow: {},
        replaceVariables: (str: string) => str.replace('$var', 'value'),
        expected: 'Prefix value ',
      },
      {
        name: 'should handle only dashboard variables',
        template: '$var1 and $var2',
        dataRow: {},
        replaceVariables: (str: string) => str.replace('$var1', 'foo').replace('$var2', 'bar'),
        expected: 'foo and bar',
      },
      {
        name: 'should handle only field interpolation',
        template: '${field1} and ${field2}',
        dataRow: { field1: 'hello', field2: 'world' },
        replaceVariables: undefined,
        expected: 'hello and world',
      },
      {
        name: 'should escape special characters in field values',
        template: '$env: ${status}',
        dataRow: { status: 'error: "failed"' },
        replaceVariables: (str: string) => str.replace('$env', 'prod'),
        expected: 'prod: error: \\&quot;failed\\&quot;',
      },
      {
        name: 'should preserve literal backslash-n in template',
        template: 'Line1\\n${field}',
        dataRow: { field: 'value' },
        replaceVariables: (str: string) => str,
        expected: 'Line1\\nvalue',
      },
      {
        name: 'should handle complex Grafana built-in variables',
        template: 'Dashboard: ${__dashboard.name}, Field: ${cpu}',
        dataRow: { cpu: '45%' },
        replaceVariables: (str: string) => str.replace('${__dashboard.name}', 'MyDashboard'),
        expected: 'Dashboard: MyDashboard, Field: 45%',
      },
      {
        name: 'should pass through plain text unchanged',
        template: 'Just plain text',
        dataRow: {},
        replaceVariables: undefined,
        expected: 'Just plain text',
      },
    ];

    testCases.forEach(({ name, template, dataRow, replaceVariables, expected }) => {
      it(name, () => {
        expect(interpolateLabelWithVariables(template, dataRow, replaceVariables)).toBe(expected);
      });
    });
  });

  describe('extractFieldReferences', () => {
    const testCases = [
      {
        name: 'should extract single field reference',
        input: 'Hello ${name}',
        expected: ['name'],
      },
      {
        name: 'should extract multiple field references',
        input: '${first} ${last}',
        expected: ['first', 'last'],
      },
      {
        name: 'should extract duplicate field references',
        input: '${x} + ${x}',
        expected: ['x', 'x'],
      },
      {
        name: 'should return empty array for no interpolations',
        input: 'Just plain text',
        expected: [],
      },
      {
        name: 'should return empty array for empty string',
        input: '',
        expected: [],
      },
      {
        name: 'should extract field with underscores',
        input: '${user_name}',
        expected: ['user_name'],
      },
      {
        name: 'should extract field with numbers',
        input: '${field1}',
        expected: ['field1'],
      },
      {
        name: 'should extract multiple different fields',
        input: 'Server: ${server}, Port: ${port}, Status: ${status}',
        expected: ['server', 'port', 'status'],
      },
      {
        name: 'should handle field names with dots',
        input: '${user.name}',
        expected: ['user.name'],
      },
      {
        name: 'should handle field names with hyphens',
        input: '${user-name}',
        expected: ['user-name'],
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(extractFieldReferences(input)).toEqual(expected);
      });
    });
  });

  describe('interpolateLabelIfNeeded', () => {
    it('should return label unchanged if no interpolation needed', () => {
      const label = 'Plain text label';
      const dataRow = { server: 'web-01' };
      expect(interpolateLabelIfNeeded(label, dataRow)).toBe(label);
    });

    it('should interpolate label with variables', () => {
      const label = 'Server: ${server}';
      const dataRow = { server: 'web-01' };
      expect(interpolateLabelIfNeeded(label, dataRow)).toBe('Server: web-01');
    });

    it('should return undefined if label is undefined', () => {
      const dataRow = { server: 'web-01' };
      expect(interpolateLabelIfNeeded(undefined, dataRow)).toBeUndefined();
    });

    it('should handle replaceVariables function', () => {
      const label = 'Env: $environment, Server: ${server}';
      const dataRow = { server: 'web-01' };
      const replaceVariables = (str: string) => str.replace('$environment', 'production');
      expect(interpolateLabelIfNeeded(label, dataRow, replaceVariables)).toBe('Env: production, Server: web-01');
    });

    it('should return label unchanged if empty string', () => {
      const label = '';
      const dataRow = { server: 'web-01' };
      expect(interpolateLabelIfNeeded(label, dataRow)).toBe('');
    });
  });

  describe('resolveTemplate', () => {
    const mockReplaceVariables = (str: string) => str.replace('${var-region}', 'us-east');

    it('should replace field references from row data', () => {
      const template = 'CPU: ${cpu}%, Memory: ${memory}%';
      const rowData = { cpu: 45, memory: 78 };
      const context = { nodeId: 'Server1' };

      expect(resolveTemplate(template, rowData, context, (s) => s)).toBe('CPU: 45%, Memory: 78%');
    });

    it('should replace node context variables', () => {
      const template = 'Node: ${__nodeId}';
      const context = { nodeId: 'Server1' };

      expect(resolveTemplate(template, {}, context, (s) => s)).toBe('Node: Server1');
    });

    it('should replace edge context variables', () => {
      const template = 'Edge: ${__edgeId} (${__source} -> ${__target})';
      const context = { edgeId: 'Server1__to__Server2', source: 'Server1', target: 'Server2' };

      expect(resolveTemplate(template, {}, context, (s) => s)).toBe('Edge: Server1__to__Server2 (Server1 -> Server2)');
    });

    it('should replace dashboard variables', () => {
      const template = 'Region: ${var-region}, Server: ${server}';
      const rowData = { server: 'web-01' };
      const context = { nodeId: 'Server1' };

      expect(resolveTemplate(template, rowData, context, mockReplaceVariables)).toBe('Region: us-east, Server: web-01');
    });

    it('should handle missing field values by replacing with empty string', () => {
      const template = 'CPU: ${cpu}%, Missing: ${missing}';
      const rowData = { cpu: 45 };
      const context = {};

      expect(resolveTemplate(template, rowData, context, (s) => s)).toBe('CPU: 45%, Missing: ');
    });

    it('should handle null field values by replacing with empty string', () => {
      const template = 'Value: ${value}';
      const rowData = { value: null };
      const context = {};

      expect(resolveTemplate(template, rowData, context, (s) => s)).toBe('Value: ');
    });

    it('should replace all variable types together', () => {
      const template = 'Region: ${var-region}, Node: ${__nodeId}, CPU: ${cpu}%';
      const rowData = { cpu: 45 };
      const context = { nodeId: 'Server1' };

      expect(resolveTemplate(template, rowData, context, mockReplaceVariables)).toBe(
        'Region: us-east, Node: Server1, CPU: 45%'
      );
    });

    it('should handle empty context', () => {
      const template = 'Node: ${__nodeId}, CPU: ${cpu}%';
      const rowData = { cpu: 45 };
      const context = {};

      expect(resolveTemplate(template, rowData, context, (s) => s)).toBe('Node: , CPU: 45%');
    });

    it('should not escape HTML in template resolution', () => {
      const template = 'Status: ${status}';
      const rowData = { status: '<healthy>' };
      const context = {};

      expect(resolveTemplate(template, rowData, context, (s) => s)).toBe('Status: <healthy>');
    });
  });

  describe('resolveDataLinks', () => {
    const mockReplaceVariables = (str: string) => str.replace('${var-region}', 'us-east');

    it('should resolve single data link', () => {
      const links = [{ title: 'Dashboard', url: 'https://example.com/d/abc?server=${server}', openInNewTab: true }];
      const rowData = { server: 'web-01' };
      const context = { nodeId: 'Server1' };

      const result = resolveDataLinks(links, rowData, context, (s) => s);

      expect(result).toEqual([
        { title: 'Dashboard', url: 'https://example.com/d/abc?server=web-01', openInNewTab: true },
      ]);
    });

    it('should resolve multiple data links', () => {
      const links = [
        { title: 'Dashboard', url: 'https://example.com/d/abc?server=${server}' },
        { title: 'Logs', url: 'https://example.com/logs?node=${__nodeId}' },
      ];
      const rowData = { server: 'web-01' };
      const context = { nodeId: 'Server1' };

      const result = resolveDataLinks(links, rowData, context, (s) => s);

      expect(result).toEqual([
        { title: 'Dashboard', url: 'https://example.com/d/abc?server=web-01', openInNewTab: false },
        { title: 'Logs', url: 'https://example.com/logs?node=Server1', openInNewTab: false },
      ]);
    });

    it('should default openInNewTab to false', () => {
      const links = [{ title: 'Link', url: 'https://example.com' }];
      const result = resolveDataLinks(links, {}, {}, (s) => s);

      expect(result[0].openInNewTab).toBe(false);
    });

    it('should resolve dashboard variables in URLs', () => {
      const links = [{ title: 'Dashboard', url: 'https://example.com?region=${var-region}&server=${server}' }];
      const rowData = { server: 'web-01' };
      const context = {};

      const result = resolveDataLinks(links, rowData, context, mockReplaceVariables);

      expect(result[0].url).toBe('https://example.com?region=us-east&server=web-01');
    });

    it('should resolve edge context variables in URLs', () => {
      const links = [{ title: 'Link', url: 'https://example.com?edge=${__edgeId}&from=${__source}&to=${__target}' }];
      const rowData = {};
      const context = { edgeId: 'A__to__B', source: 'A', target: 'B' };

      const result = resolveDataLinks(links, rowData, context, (s) => s);

      expect(result[0].url).toBe('https://example.com?edge=A__to__B&from=A&to=B');
    });

    it('should resolve template in link title', () => {
      const links = [{ title: 'Dashboard for ${server}', url: 'https://example.com' }];
      const rowData = { server: 'web-01' };
      const context = {};

      const result = resolveDataLinks(links, rowData, context, (s) => s);

      expect(result[0].title).toBe('Dashboard for web-01');
    });

    it('should handle empty links array', () => {
      const result = resolveDataLinks([], {}, {}, (s) => s);
      expect(result).toEqual([]);
    });

    it('should handle missing field values in URLs', () => {
      const links = [{ title: 'Link', url: 'https://example.com?server=${server}&missing=${missing}' }];
      const rowData = { server: 'web-01' };
      const context = {};

      const result = resolveDataLinks(links, rowData, context, (s) => s);

      expect(result[0].url).toBe('https://example.com?server=web-01&missing=');
    });
  });
});
