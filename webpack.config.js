var webpack = require("webpack");
module.exports = {
    entry: "./js/app.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    plugins: [
        new webpack.ProvidePlugin({
           $: "jquery",
           jQuery: "jquery"
       })
    ]
};
