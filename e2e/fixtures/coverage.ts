import { test as testBase, expect } from '@grafana/plugin-e2e';
import { addCoverageReport } from 'monocart-reporter';

const test = testBase.extend({
  page: async ({ page, browserName }, use, testInfo) => {
    const isChromium = browserName === 'chromium';

    if (isChromium) {
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
        reportAnonymousScripts: true,
      });
    }

    await use(page);

    if (isChromium) {
      const jsCoverage = await page.coverage.stopJSCoverage();

      const pluginCoverage = jsCoverage.filter((entry) => {
        return (
          entry.url &&
          (entry.url.includes('grafana-graphviz-panel') ||
            entry.url.includes('/src/') ||
            entry.url.includes('.ts') ||
            entry.url.includes('.tsx')) &&
          !entry.url.includes('node_modules')
        );
      });

      if (pluginCoverage.length > 0) {
        await addCoverageReport(pluginCoverage, testInfo);
      }
    }
  },
});

export { test, expect };
