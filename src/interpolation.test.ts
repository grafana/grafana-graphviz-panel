import { escapeDotLabel, interpolateLabel, hasInterpolation, extractFieldReferences } from './interpolation';

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
});
