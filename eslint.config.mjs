import next from "eslint-config-next/core-web-vitals";
const config = [
  ...next,
  {
    ignores: [
      ".next/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
    ],
  },
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];
export default config;
