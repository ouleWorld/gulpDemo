// 表示不需要打包的路径
const LIMINT_SRC = [
    'miniprogram_npm',
    'node_modules'
]

// 判断一个路径是否是合法的路径
const developerUrl = (path) => {
    for (let i = 0, len = LIMINT_SRC.length; i< len; i++) {
        let temp = LIMINT_SRC[i]
        if (path.indexOf(temp) !== -1) {
            return false
        }
    }
    return true
}

module.exports = {
    developerUrl
}