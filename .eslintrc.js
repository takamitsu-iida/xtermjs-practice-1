// npm -g install eslint
// npm -g install eslint-config-google

module.exports = {
  "extends": ["google"],
  // "installedESLint": true,
  "env": {
    "browser": true,
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
      "modules": true,
      // "experimentalObjectRestSpread": true
      "parserOptions.ecmaVersion": 2018
    }
  },
  "rules": {
    // インデントは2スペース
    "indent": ["error", 2],

    // 改行コード unix or windows
    "linebreak-style": ["error", "unix"],

    // コメント要否
    "require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": false,
        "MethodDefinition": false,
        "ClassDeclaration": false
      }
    }],

    // 無視する設定
    "max-len": "off",
    "dot-notation": "off",
    "camelcase": "off"

  }
};
