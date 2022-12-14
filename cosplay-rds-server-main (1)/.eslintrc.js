module.exports = {
    // プログラムの実行環境をESLintに教える
    env: {
        browser: true,
        es2020: true,
        jest: true,
    },

    // 共有設定を適用する。共有設定はESLintに標準で含まれているものか別途インストールしたもの、またはインストール済みのプラグインのパッケージに含まれているものを指定する
    // 共有設定: 複数のルールの適用をまとめて設定するもの
    extends: [
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
        'prettier',
        'prettier/@typescript-eslint',
        'prettier/standard',
    ],

    // ESLintが使用するパーサを指定する
    parser: '@typescript-eslint/parser',

    // パーサの各種実行オプションを設定する
    parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
    },

    // 任意のプラグインを読み込む
    // プラグイン: ESLintの組み込みルール以外に独自のルールを追加するもの
    // プラグインは読み込んだだけではなんの効力も持たず、extendsかrulesで設定する必要がある
    plugins: [
        '@typescript-eslint',
        'import',
        'unused-imports',
        'prefer-arrow',
        'prettier',
    ],

    root: true,

    // 適用する個別のルールと、エラーレベルや例外などその設定値を記述する
    // 基本的にはextendsで適用した共有設定が読み込まれているので、そのうちのいくつかを個別で無効にしたいときに設定する
    rules: {
        'lines-between-class-members': [
            'error',
            'always',
            {
                exceptAfterSingleLine: true,
            },
        ],
        // should be rewritten as `['error', { allowAsStatement: true }]` in ESLint 7 or later
        // SEE: https://github.com/typescript-eslint/typescript-eslint/issues/1184
        'no-void': 'off',
        'padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                prev: '*',
                next: 'return',
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                'vars': 'all',
                'args': 'after-used',
                'argsIgnorePattern': '_|type|of|returns',
                'ignoreRestSiblings': false,
                'varsIgnorePattern': '_',
            },
        ],
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                ts: 'never',
            },
        ],
        'prefer-arrow/prefer-arrow-functions': [
            'error',
            {
                disallowPrototype: true,
                singleReturnOnly: false,
                classPropertiesAllowed: false,
            },
        ],
        'unused-imports/no-unused-imports-ts': 'warn',
        'sort-imports': 0,
        'import/order': [
            2,
            {
                'alphabetize': {
                    'order': 'asc'
                }
            }
        ],
        '@typescript-eslint/no-floating-promises': 0,
        'import/no-unresolved': 'off', // TODO
    },
    settings: {
        'import/resolver': {
            node: {
                paths: ['src'],
            },
        }
    },
};
