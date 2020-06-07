import through2 from 'through2'
// limitSrc 中配置这不需要打包的路径
import { developerUrl } from '../config/limitSrc'

const log = console.log.bind(console)

// DEPLOY_CODE 表示gulp-clearlog 插件的配置
// DEPLOY_CODE: {
// codeArray: 需要处理的代码Array
// delete: 如果值为true, 将删除codeArray 代码; 如果值为false, 将注释化codeArray 代码
// clearComment: 如果值为true, 代码中注释内容将被删除; 如果为false, 代码中的注释内容不会被处理
// }

const DEPLOY_CODE = {
    codeArray: [
        'log()',
        'console.log()'
    ],
    delete: true, // codeArray是否删除
    clearComment: true // 是否清除备注
}

// 将DEPLOY_CODE 处理成代码需要的格式
const earnDeploy = (deployCode) => {
    let result = {
        codeArray: [],
        firstCodeArray: []
    }
    deployCode.codeArray.forEach(function (ele, index) {
        let temp = ele.slice(0, ele.indexOf('(') + 1)
        let obj = {
            origin: ele,
            codeValue: temp,
            length: temp.length,
        }
        result.firstCodeArray.push(ele[0])
        result.codeArray.push(obj)
    })

    Object.keys(deployCode).forEach(function (ele) {
        if (ele !== 'codeArray') {
            result[ele] = deployCode[ele]
        }
    })
    return result
}

// 处理之后的配置
const DEPLOY = earnDeploy(DEPLOY_CODE)
// {
//     codeArray: [
//         { origin: 'log()', codeValue: 'log(', length: 4 },
//         { origin: 'console.log()', codeValue: 'console.log(', length: 12 }
//     ],
//     firstCodeArray: [ 'l', 'c' ],
//     delete: false
// }

// 在字符串中获取对应的结束字符
// return Number
const getAimIndex = (string, sStr, eStre) => {
    /*
    判断逻辑：
        // str = '{{}}'
        // judgeNumber = 1
        // temp = str[i]
        1. 遍历从 i = 1 开始
        2. if temp = '{' || '[', judgeNum++
        3. if temp = '}' || ']', judgeNum--
        4. if temp = '}' || ']' && judgeNum === 1, return i
     */

    // 1. 先定义变量
    let str = string
    // breakStr是结束判断字符
    let startStr = sStr
    let breakStr = eStre
    let judgeNum = 0

    // 2.处理算法
    for(let i = 1, len = str.length; i < len; i++) {
        let temp = str[i]
        if (temp === startStr) {
            judgeNum++
        } else if (temp === breakStr && judgeNum !== 1) {
            judgeNum--
        } else if (temp === breakStr && judgeNum === 1) {
            // 3. 返回对应内容
            // 由于JS的末尾分号不是强制添加, 因此我们需要判断一个代码的末尾是否存在分号
            let result = (str[i + 1] === ';') ? i + 1 : i
            return result
        }
    }
}

// 处理注释, 字符串内容的函数
const sliceContent = (i, contents, result, char) => {
    // 1. 检索出目标字段(注释/字符串)
    let charIndex = contents.indexOf(char, i + 1)
    // 如果最后一条语句是备注(且没换行), 那么index 将等于字符串的长度
    let index = charIndex === -1 ? contents.length : charIndex
    // 注意这里的char
    let c = contents.slice(i, index + char.length)

    // 2. 判断目标字段的类型(注释/字符串)
    let judge = char === '\'' || char === '\"'

    // 3. 处理对应的的内容
    if (judge) {
        result += c // 字符串结果直接保留
    } else if (!judge && !DEPLOY.clearComment) {
        result += c
    } else {
        // 如果内容为注释, 且不需要被添加到结果中, 分为两种情况处理
        // a. 如果注释在一行的末尾, 那么删除注释, 且需要加上一个换行符
        // b. 如果注释是单独一行, 那么删除注释, 且需要处理注释前的空格
        let afterNIndex = contents.lastIndexOf('\n', i)
        let tempContent = contents.slice(afterNIndex + 1, i)
        // log('tempContent:', tempContent)
        if (tempContent.trim().length === 0) {
            result = result.slice(0, result.length - tempContent.length)
        } else {
            result += '\n'
        }
    }

    // 4. 返回i result 变化后的值
    i = index + char.length
    return [i, result]
}

const clideContentConfirmCode = (i, contents, result) => {
    // 1. 提取需要处理的目标代码
    let index = getAimIndex(contents.slice(i), '(', ')')
    let c = contents.slice(i, i + index + 1)

    // 2. 处理目标代码
    if (!DEPLOY.delete && c.indexOf('\n') === -1)  {
        // 如果代码不需要删除, 且目标代码为一行, 那么使用单行注释注释目标代码, 并添加到结果中
        result += `// ` + c
    } else if (!DEPLOY.delete && c.indexOf('\n') !== -1) {
        // 如果代码不需要删除, 且目标代码为国航, 那么使用多行注释注释目标代码, 并添加到结果中
        result += `/* ` + c + '*/\n'
    } else {
        // 如果代码需要删除, 那么在result 中消除该行代码中的空格内容(已经被添加到代码中)
        let afterNIndex = contents.lastIndexOf('\n', i)
        let tempContent = contents.slice(afterNIndex + 1, i)
        if (tempContent.trim().length === 0) {
            result = result.slice(0, result.length - tempContent.length)
        }
    }

    // 4. 返回结果
    i = i + index + 1
    return [i, result]
}

// 判断代码是否为目标代码
// return boolean
const confirmCode = (i, contents) => {
    // 1. 使用DEPLOY.firstCodeArray 判断是否以某关键字开头(这里使用一个字母判断, 因为不同的目标代码, 长度不一样, 不好统一)
    let index = DEPLOY.firstCodeArray.indexOf(contents[i])

    // 2. 判断是否为目标代码
    if (index === -1) {
        return false
    } else if (i === 0 || contents[i - 1] === ' ' || contents[i - 1] === '\n' || contents[i - 1] === ';') {
        // 3. 字符符合条件, 判断是否是独立的语句
        // 代码可能在有其他情况的重复, 比如一个对象拥有目标代码, 要排除这种情况, 排除的依据就是目标代码为独立的代码
        // i === 0 表示的是代码为一个js文件的第一行代码
        // 注意兼容.js 文件开头第一句为console.log() 语句的形式

        // 4. 提取目标代码, 作最后的判断, 并返回结果
        let str = contents.slice(i, i + DEPLOY.codeArray[index].length)
        return str === DEPLOY.codeArray[index].codeValue
    } else {
        return false
    }
}

// 出来代码的主函数
// return Buffer
const dealContent = (chunk) => {
    const contents = chunk.contents.toString();
    let result = ''
    let i = 0
    let len = contents.length
    while (i < len) {
        let temp = contents[i]
        // 处理当行注释, 当行注释的结束符为 \n
        if (temp === '/' && contents[i + 1] === '/') {
            [i, result] = sliceContent(i, contents, result, '\n')
            continue
        }
        // 处理多行注释, 多行注释的结束符为 */
        if (temp === '/' && contents[i + 1] === '*') {
            [i, result] = sliceContent(i, contents, result, '*/')
            continue
        }
        // 处理字符串内容, 检索符号为''
        if (temp === '\'') {
            [i, result] = sliceContent(i, contents, result, '\'')
            continue
        }
        // 处理字符串内容, 检索符号为""
        if (temp === '\"') {
            [i, result] = sliceContent(i, contents, result, '\"')
            continue
        }
        // 处理目标代码, 先判断当前代码是否为目标代码
        if (confirmCode(i, contents)) {
            [i, result] = clideContentConfirmCode(i, contents, result)
            continue
        }

        let resultLen = result.length
        if (temp === '\n' && result[resultLen - 1] === '\n' && result[resultLen - 2] === '\n') {
            // log('here: ', i)
            i++
            continue
        }

        result += temp
        i++
    }

    let s = Buffer.from(result)
    return s
}

const gulpClearLog = () => {
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

module.exports = gulpClearLog

/* md
# 1. console.log() 处理的格式
## 1.1 js 文件的首行
console.log('here')

## 1.2 语句的末尾
let a = 123; console.log(a)

## 1.3 独立行
let a = 123
console.log(a)

## 1.4 独立多行
console.log({
    a: 'here'
})

# 2. 注释
## 2.1 独立单行注释
// this is comment

## 2.2 尾部单行注释
let a = 123 // this is comment

## 2.3 多行注释

 */