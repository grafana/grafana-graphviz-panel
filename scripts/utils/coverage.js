function createSourcePath(options = {}) {
  const sanitizedOptions = sanitizeSourcePathOptions(options);

  return (filePath) => {
    const { packageName } = sanitizedOptions;

    if (filePath.includes(`${packageName}/`)) {
      return filePath.replace(new RegExp(`.*${packageName}/`), 'src/');
    }

    return filePath.startsWith('src/') ? filePath : `src/${filePath}`;
  };
}

function createSourceFilterConfig(options = {}) {
  const sanitizedOptions = sanitizeCoverageFilterOptions(options);
  const { includeTypescriptOnly, excludeTypes, additionalExclusions } = sanitizedOptions;

  return (sourcePath) => {
    if (!sourcePath.startsWith('src/')) {
      return false;
    }

    const validExtensions = includeTypescriptOnly ? ['.ts', '.tsx'] : ['.ts', '.tsx', '.js', '.jsx'];
    const hasValidExtension = validExtensions.some((ext) => sourcePath.endsWith(ext));
    if (!hasValidExtension) {
      return false;
    }

    const testPatterns = [
      '.spec.js',
      '.spec.jsx',
      '.spec.ts',
      '.spec.tsx',
      '.test.js',
      '.test.jsx',
      '.test.ts',
      '.test.tsx',
      '__mocks__',
      '__tests__',
    ];
    if (testPatterns.some((pattern) => sourcePath.includes(pattern))) {
      return false;
    }

    if (excludeTypes) {
      if (sourcePath.endsWith('.d.ts') || sourcePath.endsWith('/types.ts')) {
        return false;
      }
    }

    const excludePatterns = [
      'node_modules',
      '@popperjs',
      'external',
      'rb-tippyjs-react',
      'semver',
      'tippy.js',
      'webpack',
    ];
    if (excludePatterns.some((pattern) => sourcePath.includes(pattern))) {
      return false;
    }

    if (additionalExclusions.some((exclusion) => sourcePath.includes(exclusion))) {
      return false;
    }

    return true;
  };
}

function sanitizeSourcePathOptions(options = {}) {
  if (!options?.packageName) {
    throw new Error('Missing mandatory option: `packageName` ...');
  }

  return {
    packageName: options.packageName,
  };
}

function sanitizeCoverageFilterOptions(options = {}) {
  return {
    includeTypescriptOnly: options.includeTypescriptOnly ?? false,
    excludeTypes: options.excludeTypes ?? true,
    additionalExclusions: options.additionalExclusions ?? [],
    ...(options.packageName && { packageName: options.packageName }),
  };
}

module.exports = {
  createSourcePath,
  createSourceFilterConfig,
};
