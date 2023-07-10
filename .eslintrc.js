module.exports =  {
  plugins: [
    "@typescript-eslint",
    "eslint-plugin-tsdoc"
  ],
  extends:  [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended'
  ],
  parser:  '@typescript-eslint/parser',
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "tsdoc/syntax": "warn"
  },

};
