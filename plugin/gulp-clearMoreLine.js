import through2 from 'through2'

import { developerUrl } from '../config/limitSrc'

const log = console.log.bind(console)

const dealContent = (chunk) => {
    // 1. 先将文件内容由Buffer 转换为字符串
    const contents = chunk.contents.toString();
    let result = ''
    let i = 0
    let len = contents.length

    while(i < len) {
        // 2. 如果遇到\n, 则开始处理
        // 注意这里的顺序问题, 是先归位, 再换行
        // \n 的存储格式为: 0d 0a, 长度为2
        if (contents.charCodeAt(i) === 13 && contents.charCodeAt(i + 1) === 10) {
            // 3. 如果连续3 个\n, 则不累加
            if (contents.charCodeAt(i - 1) === 10 &&
                contents.charCodeAt(i - 2) === 13 &&
                contents.charCodeAt(i - 3) === 10 &&
                contents.charCodeAt(i - 4) === 13 ) {
                // log('i: ', i)
                i = i + 2
                continue
            } else if (result.length === 0) {
                // 4. 如果一个js 文件的开头为\n, 则不累加
                i = i + 2
                continue
            }
        }

        result += contents[i]
        i++
    }
    let s = Buffer.from(result)
    return s
}

const clearMoreLine = () =>{
    let t = through2.obj(function (chunk, enc, callback) {
        log('当前路径: ', chunk.path)
        if (chunk.extname.slice(1) === 'js' && developerUrl(chunk.path)) {
            chunk.contents = dealContent(chunk);
        }
        this.push(chunk);
        callback();
    })
    return t
}

module.exports = clearMoreLine

/*
    在Buffer 对象中, \n 的存储格式为: 0d 0a, 长度为2

    原理非常简单, 只需要判断连续的3个字符是否为 \n 即可
 */