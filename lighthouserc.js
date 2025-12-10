module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        "http://localhost:3000/dashboard/overview",
        "http://localhost:3000/dashboard/leads",
        "http://localhost:3000/dashboard/reports",
      ],
      startServerCommand: "pnpm build && pnpm start",
      startServerReadyPattern: "ready - started server",
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 720,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },
        emulatedUserAgent: "mobile",
      },
    },
    assert: {
      budgetPath: "./lighthouse.budgets.json",
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-reports",
    },
  },
};
