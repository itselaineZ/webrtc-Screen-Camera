var express = require('express');
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');
var fs = require('fs')
var iconv = require('iconv-lite')
var converter = require('encoding')


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
var read_conf_done = false
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
router.get('/', function (req, res) {
    if (read_conf_done == false) {
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
        //read_conf_done = true
    }
    res.sendfile(path.join(__dirname, "public/login.html"))
    //_dirname:当前文件的路径，path.join():合并路径
})

router.get('/login', function (req, res) {
    var no = req.query.name
    var grade = req.query.grade
    var pwd = req.query.password

    if (read_conf_done == false) {
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
        //read_conf_done = true
    }

    var query1 = "select * from student where stu_no='" + no + "' and stu_password='" + pwd + "' and stu_grade='" + grade + "'"
    console.log(query1);
    connection.query(query1, function (err, result) {
        //if (err) throw err;
        //console.log(result);
        if (result.length == 0) {
            res.redirect('/login.html');
        } else {
            var res_json = JSON.parse(JSON.stringify(result));
            var msg = {
                user: res_json[0],
                conf: conf
            };
            if (msg.user.stu_userlevel > '0') {//老师监控端
                if (msg.user.stu_enable == '1') {//有登录权限
                    var md5 = crypto.createHash('md5');
                    var result = md5.update(msg.user.stu_no).digest('hex');
                    if (msg.user.stu_password !== result) {
                        var query2 = "select * from student where stu_userlevel='0' and stu_enable='1'"
                        connection.query(query2, function (err, resu) {
                            var all_stu = JSON.parse(JSON.stringify(resu));
                            var msg = {
                                user: res_json[0],
                                conf: conf,
                                stu: all_stu
                            }
                            console.log(all_stu)
                            res.render("server", { msg }, (err, data) => {
                                res.send(data);
                            })
                        })
                    }
                    else {
                        console.log(msg)
                        res.render("changePwd", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                }
            }
            else {//学生被监视端
                if (msg.user.stu_enable == '1') {//有登录权限
                    var md5 = crypto.createHash('md5');
                    var result = md5.update(msg.user.stu_no).digest('hex');
                    if (msg.user.stu_password !== result) {
                        res.render("camera", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                    else {
                        console.log(msg)
                        res.render("changePwd", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                }
            }
            //res.redirect('/login.html');//账户存在但由于某些原因无法登录
        }
    })
})

router.get('/changepwd', function (req, res) {
    var no = req.query.name_hidden
    var grade = req.query.grade_hidden
    var pwd = req.query.password
    var query1 = "update student set stu_password= '" + pwd + "'where stu_no='" + no + "' and stu_grade='" + grade + "'"
    console.log(query1);
    connection.query(query1, function (err, result) {
        if (err) throw err;
        else {
            res.redirect('/login.html');
        }
    })
})
module.exports = router;