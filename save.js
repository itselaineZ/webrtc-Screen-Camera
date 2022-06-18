var express = require('express');
var formidable = require('formidable');
var fs = require('fs')
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var iconv = require('iconv-lite')

var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'ZXYgyt216216@',
    database: 'user'
})
connection.connect()

var conf = {
    root_dir: null,
    width: null,
    high: null,
    rate: null,
    disconnect: null
}
const video_url = "/etc/webrtc-zxygyt.conf"
function readConf(data) {
    var lines = data.split('\n')
    for (let i = 0; i < lines.length; i++) {
        if (lines[i][0] == '#' || lines[i][0] == ';') {
            continue
        }
        if (lines[i][0] == '[') {//group item
            if (lines[i].indexOf('root-dir') == 1) {
                while (++i < lines.length && (lines[i].length == 0 || lines[i][0] == '#' || lines[i][0] == ';')) { }
                conf.root_dir = lines[i].split('#')[0];
                conf.root_dir = conf.root_dir.split(';')[0];
                conf.root_dir = conf.root_dir.split(' ')[0];
                console.log('root_dir: ', conf.root_dir)
                break
            }
            else if (lines[i].indexOf('frame') == 1) {
                while (!conf.high || !conf.width || !conf.rate) {
                    while (++i < lines.length && (lines[i].length == 0 || lines[i][0] == '#' || lines[i][0] == ';')) { }
                    if (i == lines.length) {
                        break
                    }
                    if (lines[i].indexOf('width') == 0) {
                        conf.width = lines[i].split('#')[0];
                        conf.width = conf.width.split(';')[0];
                        conf.width = conf.width.split('=')[1];
                        let num = conf.width.split(' ');
                        for (let j = 0; j < num.length; j++) {
                            if (num[j].length !== 0) {
                                conf.width = parseInt(num[j])
                                break
                            }
                        }
                        console.log('width: ', conf.width)
                    }
                    else if (lines[i].indexOf('high') == 0) {
                        conf.high = lines[i].split('#')[0];
                        conf.high = conf.high.split(';')[0];
                        conf.high = conf.high.split('=')[1];
                        let num = conf.high.split(' ');
                        for (let j = 0; j < num.length; j++) {
                            if (num[j].length !== 0) {
                                conf.high = parseInt(num[j])
                                break
                            }
                        }
                        console.log('high: ', conf.high)
                    }
                    else if (lines[i].indexOf('rate') == 0) {
                        conf.rate = lines[i].split('#')[0];
                        conf.rate = conf.rate.split(';')[0];
                        conf.rate = conf.rate.split('=')[1];
                        let num = conf.rate.split(' ');
                        for (let j = 0; j < num.length; j++) {
                            if (num[j].length !== 0) {
                                conf.rate = parseInt(num[j])
                                break
                            }
                        }
                        console.log('rate: ', conf.rate)
                    }
                    //i++;
                }
            }
            else if (lines[i].indexOf('断联时间') == 1) {
                while (++i < lines.length && (lines[i].length == 0 || lines[i][0] == '#' || lines[i][0] == ';')) { }
                conf.disconnect = lines[i].split('#')[0];
                conf.disconnect = conf.disconnect.split(';')[0];
                conf.disconnect = conf.disconnect.split('=')[1];
                let num = conf.disconnect.split(' ');
                for (let j = 0; j < num.length; j++) {
                    if (num[j].length !== 0) {
                        conf.disconnect = parseInt(num[j])
                        break
                    }
                }
                console.log('disconnect: ', conf.disconnect)
            }
        }
    }
}

// 递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

router.post('/saveVideo', function (req, res) {
    //读取配置文件内容
    var buf = new Buffer.alloc(1024);
    fs.open(video_url, 'r+', function (err, fd) {
        if (err) {
            return console.error(err);
        }
        console.log("prepare reading conf file......");
        fs.read(fd, buf, 0, buf.length, 0, function (err, bytes) {
            if (err) {
                console.log(err);
            }
            var conf_data = buf.slice(0, bytes).toString();
            readConf(conf_data)
        });
    });

    console.log(path.join(__dirname, '../'))
    //console.log(request)
    //const form=new formidable.IncomingForm({uploadDir:"/root"});
    const form = formidable({
        uploadDir: path.join(__dirname, '../'), // 上传文件放置的目录
        keepExtensions: true,           //包含源文件的扩展名
        multiples: true                 //多个文件的倍数
    })
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.json({ 'result': '-1', 'msg': 'save failed' })
            return
        }
        // res.json({      //响应json数据
        //     code: 200,
        //     data: { fields, files }
        // })
        console.log(files.length);
        console.log(files);
        console.log(fields);
        var utf_name = iconv.encode(fields.stu_name, 'utf-8');
        var time = new Date()
        var oldpath = files.content.filepath;
        console.log('old:::::' + oldpath)
        var newpath = conf.root_dir + '/u' + fields.stu_no + '/'
        var newname = 'u' + fields.stu_no +
            '-' + fields.stu_name + 
            '-' + fields.kind + '-' +
            time.getFullYear() + '-' + time.getMonth() + '-' + time.getDate() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds() + '.webm'
        console.log('new:::::' + newpath + newname);
        mkdirsSync(newpath)
        var fullpathname = newpath + newname
        fs.access(fullpathname, fs.constants.F_OK, (err) => {
            if (err) {
                console.log('not have one')
                fs.rename(oldpath, fullpathname, (err) => {
                    //改变上传文件的存放位置和文件名
                    if (err) {
                        res.json({ 'result': '-2', 'msg': 'save failed' })
                    }
                    res.json({ 'result': '0', 'msg': 'save success' })
                })
            } else {
                console.log('already have')
                fs.appendFile(fullpathname, files, function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('append file success!')
                    }
                })
            }
        })

    })
})
module.exports = router;

