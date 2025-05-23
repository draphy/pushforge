module.exports = {
  branches: ['latest-release', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: [],
      },
    ],
  ],
  tagFormat: 'builder@${version}',
};
