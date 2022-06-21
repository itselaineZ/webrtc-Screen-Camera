var express = require('express');
var formidable = require('formidable');
var fs = require('fs')
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var iconv = require('iconv-lite')
var shell = require('shelljs');

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

function runFFmpegCombine_Webm(txtfile, outPath, mp4Path) {
    console.log('ffmpeg -f concat -safe 0 -y -i ' + txtfile + ' -c copy ' + outPath + '\n')
    let shells = '#!/bin/bash\nffmpeg -f concat -safe 0 -y -i ' + txtfile + ' -c copy ' + outPath + '\n'
    //shells = shells + 'ffmpeg -i ' + outPath + ' -max_muxing_queue_size 10240 '+ mp4Path + '\n'
    const files = fs.readFileSync(txtfile, { flag: 'r' })
    var buf = new Buffer.alloc(102400);
    fs.open(txtfile, 'r+', function (err, fd) {
        if (err) {
            return console.error(err);
        }
        fs.read(fd, buf, 0, buf.length, 0, function (err, bytes) {
            if (err) {
                console.log(err);
            }
            var files = buf.slice(0, bytes).toString();

            var lines = files.split('\n')
            for (let i = 0; i < lines.length; i++) {
                let filepath = lines[i].split(' ')[1]
                if (filepath) {
                    filepath = filepath.split("\'")[1]
                    console.log('rm -rf ' + filepath)
                    shells = shells + 'rm -rf ' + filepath + '\n'
                }
            }
            console.log('rm -rf ' + txtfile)
            shells = shells + 'rm -rf ' + txtfile + '\n'

            let buffer = new Buffer.from(shells)
            fs.open('./shell.sh', 'a', function (err, fd) {
                if (err) {
                    console.log('Cant open file');
                } else {
                    fs.write(fd, buffer, 0, buffer.length,
                        null, function (err, writtenbytes) {
                            if (err) {
                                console.log('Cant write to file');
                            } else {
                                console.log(writtenbytes + ' characters added to shell file');
                                shell.exec('sh shell.sh')
                                console.log('rm -f ./shell.sh')
                                shell.exec('rm -f ./shell.sh')
                            }
                        })
                }
            })
        });
    });
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
        console.log(files);
        console.log(fields);
        var time = new Date()
        // var changename1 = iconv.encode(fields.stu_name, 'gbk')
        // var changename2 = iconv.encode(fields.stu_name, 'utf8')
        // var changename3 = iconv.decode(fields.stu_name, 'gbk')
        // var changename4 = iconv.decode(fields.stu_name, 'utf8')
        var oldpath = files.content.filepath;
        console.log('old:::::' + oldpath)
        var newpath = conf.root_dir + '/u' + fields.stu_no + '/'
        var newname = 'u' + fields.stu_no +
            //'-' + changename1 + '-' + changename2 + '-' + changename3 + '-' + changename4 +
            //'-' + fields.stu_name +
            '-' + fields.kind + '-' +
            time.getFullYear() + '-' + time.getMonth() + '-' + time.getDate() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds() + '.webm'
        console.log('new:::::' + newpath + newname);
        mkdirsSync(newpath)
        var fullpathname = newpath + newname

        fs.access(fullpathname, fs.constants.F_OK, (err) => {
            if (err) {
                console.log('not have one')
                fs.rename(oldpath, fullpathname, (err) => {
                    if (err) {
                        res.json({ 'result': '-2', 'msg': 'save failed' })
                    }
                    res.json({ 'result': '0', 'msg': 'save success' })
                })
            } else {
                console.log('already have')
            }
        })
        var txtpath = newpath + '/u' + fields.stu_no + '-' + fields.kind + '.txt'
        let buffer = new Buffer.from('file ' + "\'" + fullpathname + "\'\n")
        fs.open(txtpath, 'a', function (err, fd) {
            if (err) {
                console.log('Cant open file');
            } else {
                fs.write(fd, buffer, 0, buffer.length,
                    null, function (err, writtenbytes) {
                        if (err) {
                            console.log('Cant write to file');
                        } else {
                            console.log(writtenbytes +
                                ' characters added to file');
                        }
                    })
            }
        })
    })
})
router.post('/mergeVideo', function (req, res) {
    var stu_no
    var kind
    const form = formidable({
        uploadDir: path.join(__dirname, '../'), // 上传文件放置的目录
        keepExtensions: true,           //包含源文件的扩展名
        multiples: true                 //多个文件的倍数
    })
    form.parse(req, (err, fields, files) => {
        console.log(fields)
        stu_no = fields.stu_no
        kind = fields.kind
        console.log('in mergeVideo')
        //读取配置文件内容
        var buf = new Buffer.alloc(1024);
        fs.open(video_url, 'r+', function (err, fd) {
            if (err) {
                return console.error(err);
            }
            fs.read(fd, buf, 0, buf.length, 0, function (err, bytes) {
                if (err) {
                    console.log(err);
                }
                var conf_data = buf.slice(0, bytes).toString();
                readConf(conf_data)
            });
        });
        var time = new Date()
        var txtpath = conf.root_dir + '/u' + stu_no + '/u' + stu_no + '-' + kind + '.txt'
        var outPath = conf.root_dir + '/u' + stu_no + '/u' + stu_no + '-' + kind + '-' +
            time.getFullYear() + '-' + time.getMonth() + '-' + time.getDate() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds() + '-1.webm'
        var mp4Path = conf.root_dir + '/u' + stu_no + '/u' + stu_no + '-' + kind + '-' +
        time.getFullYear() + '-' + time.getMonth() + '-' + time.getDate() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds() + '.mp4'
            console.log('new:::::' + outPath);
        runFFmpegCombine_Webm(txtpath, outPath,mp4Path)
    })

})
module.exports = router;

