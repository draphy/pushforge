module.exports = {
  branches: ['latest-release', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'dist/**/*.js', label: 'JS distribution' },
          { path: 'dist/**/*.d.ts', label: 'TypeScript declarations' },
        ],
      },
    ],
  ],
  tagFormat: 'builder@${version}',
};
