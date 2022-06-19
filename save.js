var express = require('express');
var formidable = require('formidable');
var fs = require('fs')
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var iconv = require('iconv-lite')
var ffmpeg = require('fluent-ffmpeg');
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

function runFFmpegCombine_Webm(file, file2, outPath) {
    console.log('here5')
    console.log(file)
    console.log(file2)
    try {
        var proc = ffmpeg(file);
        console.log('here6')
        proc = proc.input(file2);
        console.log('here7')
        proc.mergeToFile('/root/aaaa.webm').on('end', function () {
            console.log('video merge success');
        });
    } catch (err) {
        console.log('an error occured!', err);
    }
}
function runFFmpegCombine_Webm1(txtfile, outPath) {
    console.log('ffmpeg -f concat -safe 0 -y -i ' + txtfile + ' -c copy ' + outPath)
    if (shell.exec('ffmpeg -f concat -safe 0 -y -i ' + txtfile + ' -c copy ' + outPath).code !== 0) {
        shell.echo('Error:merge failed');
        shell.exit(1);
    }
    const data = fs.readFileSync(txtfile, { flag: 'r' })
    console.log(data)
    var lines = data.split('\n')
    for (let i = 0; i < lines.length; i++) {
        console.log(lines[i])
        let filepath = lines[i].split(' ')[1]
        filepath = lines[i].split('\'')[0]
        console.log('rm -f ' + filepath)
        if (shell.exec('rm -f ' + filepath).code !== 0) {
            shell.echo('Error: '+filepath + ' delete failed');
            shell.exit(1);
        }
    }
    console.log('rm -f ' + txtfile)
    if (shell.exec('rm -f ' + txtfile).code !== 0) {
        shell.echo('Error: txt file delete failed');
        shell.exit(1);
    }
}
var videoname = []
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
                    // fs.writeFile(fullpathname, files, { encoding: 'gbk' }, (err) => {
                    //改变上传文件的存放位置和文件名
                    if (err) {
                        res.json({ 'result': '-2', 'msg': 'save failed' })
                    }
                    res.json({ 'result': '0', 'msg': 'save success' })
                })
            } else {
                console.log('already have')
                // fs.appendFile(fullpathname, files, function (err) {
                //     if (err) {
                //         console.log(err)
                //     } else {
                //         console.log('append file success!')
                //     }
                // })
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
        // if (videoname[fields.stu_no]) {
        //     if (fields.kind == 'video') {
        //         console.log('here1')
        //         if (videoname[fields.stu_no].video) {
        //             console.log('here2')
        //             runFFmpegCombine_Webm(videoname[fields.stu_no].video, fullpathname, fullpathname)
        //         }
        //         videoname[fields.stu_no].video = fullpathname
        //     }
        //     else {
        //         console.log('here3')
        //         if (videoname[fields.stu_no].screen) {
        //             console.log('here4')
        //             runFFmpegCombine_Webm(videoname[fields.stu_no].screen, fullpathname, fullpathname)
        //         }
        //         videoname[fields.stu_no].screen = fullpathname
        //     }
        // }
        // else {
        //     let name_con = {
        //         video: null,
        //         screen: null
        //     }
        //     if (fields.kind == 'video') {
        //         name_con.video = fullpathname
        //     }
        //     else {
        //         name_con.screen = fullpathname
        //     }
        //     videoname[fields.stu_no] = name_con
        // }
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
            console.log("prepare reading conf file......");
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
            time.getFullYear() + '-' + time.getMonth() + '-' + time.getDate() + '-' + time.getHours() + '-' + time.getMinutes() + '-' + time.getSeconds() + '.webm'
        console.log('new:::::' + outPath);
        runFFmpegCombine_Webm1(txtpath, outPath)
    })

})
module.exports = router;

