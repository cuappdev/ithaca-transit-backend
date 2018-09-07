module.exports = {
    "parser": "babel-eslint",
    "plugins": ["jest"],
    "env": {
        "jest/globals": true
    },
    "extends": "airbnb",
    "rules": {
        // for babel-eslint
        "strict": 0,

        // indentation
        "indent": [2, 4, { "SwitchCase": 1 }],

        // spacing
        "object-curly-spacing": [2, "always"],
        "no-multiple-empty-lines": [2, {"max": 1, "maxEOF": 0, "maxBOF": 0}],

        // code arrangement matter
        "no-use-before-define": [2, {"functions": false}],

        // make it meaningful
        "prefer-const": 1,

        // react
        "react/prefer-es6-class": 0,
        "react/jsx-filename-extension": 0,
        "react/jsx-curly-spacing": [2, "always"],
        "react/jsx-indent": [2, 4],

        // no error on override
        "class-methods-use-this": [0],

        // allow unused parameters
        "no-unused-vars": ["error", { "args": "none" }],

        // no radix required in parseInt
        "radix": ["error", "as-needed"],

        // allow long lines
        "max-len": ["error", { "code": 200 }],

        // allow unary operator
        "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],

        // do not use destructuring for arrays
        "prefer-destructuring": ["error", {
            "VariableDeclarator": {
                "array": false,
                "object": true
            },
            "AssignmentExpression": {
                "array": false,
                "object": false
            }
        }, {
            "enforceForRenamedProperties": false
        }],

        // ignore trailing spaces since some IDEs insert by default
        "no-trailing-spaces": ["error", { "skipBlankLines": true }],

        // allow reassignment of param properties
        "no-param-reassign": [2, { "props": false }]
    }
};