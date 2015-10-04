({
    appDir: 'fireworks-client/src',
    baseUrl: 'js',
    mainConfigFile: 'fireworks-client/src/js/config.js',
    dir: 'fireworks-client/bin',
    fileExclusionRegExp: /^\..*|^jsx$|^exclude$/,
    optimizeCss: 'standard',
    //removeCombined: true,
    paths: {
        jquery: 'empty:',
        'React': 'empty:'
    },
    modules: [
        {
            name: 'index'
        },
    ]
})