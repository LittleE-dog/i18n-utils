/**
 * Created by zw on 2020/05/11.
 */
//express使用的是@4版本的。
var express = require('express');
var XLSX = require('xlsx');
var fs = require('fs');

//form表单需要的中间件。
var mutipart = require('connect-multiparty');

let OSS = require('ali-oss')

let client = new OSS({
    region: 'xxx', //阿里云对象存储地域名
    accessKeyId: 'xxx', //api接口id
    accessKeySecret: 'xxx', //api接口密码
})

client.useBucket('xxx') //使用的存储桶名


var mutipartMiddeware = mutipart();
var app = express();
//下面会修改临时文件的储存位置，如过没有会默认储存别的地方，这里不在详细描述,这个修改临时文件储存的位置 我在百度里查找了三四个小时才找到这个方法，不得不说nodejs真难学。
//所以在这里留下我的学习记录，以备以后翻阅。

app.use(mutipart({
    uploadDir: './linshi'
}));
//设置http服务监听的端口号。
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log("Express started on http://localhost:" + app.get('port') + '; press Ctrl-C to terminate.');
});
//浏览器访问localhost会输出一个html文件
app.get('/', function (req, res) {
    res.type('text/html');
    res.sendfile('public/index.html')

});
//这里用来玩，express框架路由功能写的，与上传文件没没有关系。
app.get('/about', function (req, res) {
    res.type('text/plain');
    res.send('Travel about');
});
//这里就是接受form表单请求的接口路径，请求方式为post。
app.post('/upload', mutipartMiddeware, function (req, res) {
    //这里打印可以看到接收到文件的信息。
    console.log(req.files);
    /*//do something
     * 成功接受到浏览器传来的文件。我们可以在这里写对文件的一系列操作。例如重命名，修改文件储存路径 。等等。
     *
     *
     * */
    var wb = XLSX.readFile(req.files.myfile.path)
    var sheets = wb.Sheets
    var content = transformSheets(sheets)
    var en = {};
    var zh = {};
    // var br = {}
    content.forEach(x => {
        if (x[0] && x[0] != '' && x[0] != 'undefined' && x[1] && x[1] != ''&& x[2] && x[2] != '') {
            var paramNames = x[0].split('.');
            if (en[paramNames[0]]) {
                en[paramNames[0]][paramNames[1]] = x[1].replace(/"/g, "'").replace("\n", "");
                zh[paramNames[0]][paramNames[1]] = x[2].replace(/"/g, "'").replace("\n", "");
                // br[paramNames[0]][paramNames[1]] = x[3].replace(/"/g, "'").replace("\n", "");
            } else {
                en[paramNames[0]] = {}
                zh[paramNames[0]] = {}
                // br[paramNames[0]] = {}
                en[paramNames[0]][paramNames[1]] = x[1].replace(/"/g, "'").replace("\n", "");
                zh[paramNames[0]][paramNames[1]] = x[2].replace(/"/g, "'").replace("\n", "");
                // br[paramNames[0]][paramNames[1]] = x[3].replace(/"/g, "'").replace("\n", "");
            }
        }


    });
    // let p1 = /"[a-zA-Z0-9_]+":/g
    en = JSON.stringify(en);
    // .replace(p1, (match, ) => {
    //     let newStr = match.replace(/"/g, '')
    //     return newStr
    // })
    // this.en = en;
    zh = JSON.stringify(zh);
    // .replace(p1, (match, ) => {
    //     let newStr = match.replace(/"/g, '')
    //     return newStr
    // })
    // this.zh = zh;
    // br = JSON.stringify(br);
    // .replace(p1, (match, ) => {
    //     let newStr = match.replace(/"/g, '')
    //     return newStr
    // })
    // this.br = br;zh

    // this.doSave('window.en = ' + en, "text/latex", "en.js");
    fs.writeFile('./linshi/en.js', 'window.en = ' + en, function (error) {
        if (error) {
            throw error;
        } else {
            put('en.js')
            console.log('en写入成功')
        }
    })
    // this.doSave('window.en = ' + en, "text/latex", "en.js");
    fs.writeFile('./linshi/zh.js', 'window.zh = ' + zh, function (error) {
        if (error) {
            throw error;
        } else {
            put('zh.js')
            console.log('zh写入成功')
        }
    })
    // this.doSave('window.zh = ' + zh, "text/latex", "zh.js");

    //给浏览器返回一个成功提示。
    res.send('upload success!');
});

function transformSheets(sheets) {
    var content = []
    var content1 = []
    var tmplist = []
    for (let key in sheets) {
        //读出来的workbook数据很难读,转换为json格式,参考https://github.com/SheetJS/js-xlsx#utility-functions
        tmplist.push(XLSX.utils.sheet_to_json(sheets[key]).length)
        content1.push(XLSX.utils.sheet_to_json(sheets[key]))
    }
    var maxLength = Math.max.apply(Math, tmplist)
    //进行行列转换
    for (let y in [...Array(maxLength)]) {
        content.push([])
        for (let x in [...Array(tmplist.length)]) {
            try {
                if (content1[x][y]['KEY']) {
                    for (let z in content1[x][y]) {
                        // eslint-disable-next-line no-debugger
                        debugger
                        content[y].push(content1[x][y][z])
                    }
                }
            } catch (error) {
                content[y].push(' ')
            }
        }
    }
    return content

}

//向存储桶中添加文件的接口
async function put(filename) {
    try {
        let result = await client.put('i18n/' + filename, 'linshi/' + filename)
        console.log(result) //在此处记录 url name 等信息
    } catch (err) {
        console.log(err)
    }
}