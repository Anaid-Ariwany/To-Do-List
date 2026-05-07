const path = require('path');

module.exports = {
    mode: 'development',

    entry: './src/index.js',

    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },

    devtool: 'eval-source-map',

    devServer: {
        static: './dist',
        open: true,
        hot: true,
    },

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
