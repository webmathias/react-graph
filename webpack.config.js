const webpack = require('webpack');
const path = require('path')
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'index.js',
        libraryTarget: 'commonjs2' // THIS IS THE MOST IMPORTANT LINE! :mindblow: I wasted more than 2 days until realize this was the line most important in all this guide.
    },

    devServer: {
        port: 3000,
        contentBase: './public'
    },
    devtool: 'source-map',
    resolve: {
        extensions: [".js", ".json", ".jsx"]
    },
    plugins: [

    ],
    module: {
        rules: [
            {
                test: /\.js[x]?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    },
    externals: {
        'react': 'commonjs react', // this line is just to use the React dependency of our parent-testing-project instead of using our own React.
        'd3': 'commonjs d3' // this line is just to use the React dependency of our parent-testing-project instead of using our own React.
    }
};