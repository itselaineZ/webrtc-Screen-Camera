var express = require('express');
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');

var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'ZXYgyt216216@',
    database: 'user'
})
connection.connect()

router.get('/', function (req, res) {
    res.sendfile(path.join(__dirname, "public/login.html"))
    //_dirname:当前文件的路径，path.join():合并路径
})

router.get('/login', function (req, res) {
    var no = req.query.name
    var grade = req.query.grade
    var pwd = req.query.password
    var query1 = "select * from student where stu_no='" + no + "' and stu_password='" + pwd + "' and stu_grade='" + grade + "'"
    console.log(query1);
    connection.query(query1, function (err, result) {
        //if (err) throw err;
        console.log(result);
        if (result.length == 0) {
            res.redirect('/login.html');
        } else {
            var res_json = JSON.parse(JSON.stringify(result));
            var msg = res_json[0];
            if (msg.stu_userlevel > '5') {//老师监控端
                if (msg.stu_enable == '1') {//有登录权限
                    var md5 = crypto.createHash('md5');
                    var result = md5.update(msg.stu_no).digest('hex');
                    if (msg.stu_password !== result) {
                        res.render("server", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                    else {
                        res.render("changePwd", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                }
            }
            else {//学生被监视端
                if (msg.stu_enable == '1') {//有登录权限
                    var md5 = crypto.createHash('md5');
                    var result = md5.update(msg.stu_no).digest('hex');
                    if (msg.stu_password !== result) {
                        res.render("camera", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                    else {
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
    var query1 = "update student set stu_password= '"+pwd+"'where stu_no='" + no + "' and stu_grade='" + grade + "'"
    console.log(query1);
    connection.query(query1, function (err, result) {
        if (err) throw err;
        else{
            res.redirect('/login.html');
        }
    })
})
module.exports = router;
