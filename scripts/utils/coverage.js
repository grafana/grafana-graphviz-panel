function createSourcePath(options = {}) {
  const sanitizedOptions = sanitizeSourcePathOptions(options);

  return (filePath) => {
    const { packageName } = sanitizedOptions;
    const pathWithoutQuery = filePath.split('?')[0];

    const isWebpackInternal = pathWithoutQuery.startsWith('webpack-internal:///./');
    if (isWebpackInternal) {
      return pathWithoutQuery.replace('webpack-internal:///./', 'src/');
    }

    const isWebpackProtocolWithDotSlash = pathWithoutQuery.includes(`${packageName}/./`);
    if (isWebpackProtocolWithDotSlash) {
      return pathWithoutQuery.replace(new RegExp(`.*${packageName}/\\.\/`), 'src/');
    }

    const isPackagePath = pathWithoutQuery.includes(`${packageName}/`);
    if (isPackagePath) {
      return pathWithoutQuery.replace(new RegExp(`.*${packageName}/`), 'src/');
    }

    const alreadyHasSrcPrefix = pathWithoutQuery.startsWith('src/');
    return alreadyHasSrcPrefix ? pathWithoutQuery : `src/${pathWithoutQuery}`;
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
