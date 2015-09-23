({
    appDir: '../../',
    baseUrl: './js',
    mainConfigFile: '../config.js',
    dir: '../../../www-built',
    fileExclusionRegExp: /^\..*|^a$|^exclude$/,
    optimizeCss: 'standard',
    removeCombined: true,
    paths: {
        jquery: 'empty:',
        'React': 'empty:'
    },
    modules: [
        {
            name: 'index'
        },
        {
            name: 'champions'
        },
        {
            name: 'champion'
        },
        {
            name: 'about'
        }
    ]
})