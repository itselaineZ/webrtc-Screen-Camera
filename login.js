var express = require('express');
var path = require('path');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');
var fs = require('fs')
var iconv = require('iconv-lite')
var converter = require('encoding')
var buf = require('buffer')


var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'ZXYgyt216216@',
    database: 'user',
    charset: 'GBK_CHINESE_CI'
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
            else if (lines[i].indexOf('ï¿½ï¿½ï¿½ï¿½Ê±ï¿½ï¿½') == 1) {
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
        //ï¿½ï¿½È¡ï¿½ï¿½ï¿½ï¿½ï¿½Ä¼ï¿½ï¿½ï¿½ï¿½ï¿½
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
})
GB2312UTF8 = {
    Dig2Dec: function (s) {
        var retV = 0;
        if (s.length == 4) {
            for (var i = 0; i < 4; i++) {
                retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
            }
            return retV;
        }
        return -1;
    },

    Hex2Utf8: function (s) {
        var retS = "";
        var tempS = "";
        var ss = "";
        if (s.length == 16) {
            tempS = "1110" + s.substring(0, 4);
            tempS += "10" + s.substring(4, 10);
            tempS += "10" + s.substring(10, 16);
            var sss = "0123456789ABCDEF";
            for (var i = 0; i < 3; i++) {
                retS += "%";
                ss = tempS.substring(i * 8, (eval(i) + 1) * 8);
                retS += sss.charAt(this.Dig2Dec(ss.substring(0, 4)));
                retS += sss.charAt(this.Dig2Dec(ss.substring(4, 8)));
            }
            return retS;
        }
        return "";
    },

    Dec2Dig: function (n1) {
        var s = "";
        var n2 = 0;
        for (var i = 0; i < 4; i++) {
            n2 = Math.pow(2, 3 - i);
            if (n1 >= n2) {
                s += '1';
                n1 = n1 - n2;
            }
            else
                s += '0';
        }
        return s;
    },

    Str2Hex: function (s) {
        var c = "";
        var n;
        var ss = "0123456789ABCDEF";
        var digS = "";
        for (var i = 0; i < s.length; i++) {
            c = s.charAt(i);
            n = ss.indexOf(c);
            digS += this.Dec2Dig(eval(n));
        }
        return digS;
    },

    GB2312ToUTF8: function (s1) {
        var s = escape(s1);
        var sa = s.split("%");
        var retV = "";
        if (sa[0] != "") {
            retV = sa[0];
        }
        for (var i = 1; i < sa.length; i++) {
            if (sa[i].substring(0, 1) == "u") {
                //alert(this.Str2Hex(sa[i].substring(1,5)));
                retV += this.Hex2Utf8(this.Str2Hex(sa[i].substring(1, 5)));
                if (sa[i].length) {
                    retV += sa[i].substring(5);
                }
            }
            else {
                retV += unescape("%" + sa[i]);
                if (sa[i].length) {
                    retV += sa[i].substring(5);
                }
            }
        }
        return retV;
    },

    UTF8ToGB2312: function (str1) {
        var substr = "";
        var a = "";
        var b = "";
        var c = "";
        var i = -1;
        i = str1.indexOf("%");
        if (i == -1) {
            return str1;
        }
        while (i != -1) {
            if (i < 3) {
                substr = substr + str1.substr(0, i - 1);
                str1 = str1.substr(i + 1, str1.length - i);
                a = str1.substr(0, 2);
                str1 = str1.substr(2, str1.length - 2);
                if (parseInt("0x" + a) & 0x80 == 0) {
                    substr = substr + String.fromCharCode(parseInt("0x" + a));
                }
                else if (parseInt("0x" + a) & 0xE0 == 0xC0) { //two byte
                    b = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    var widechar = (parseInt("0x" + a) & 0x1F) << 6;
                    widechar = widechar | (parseInt("0x" + b) & 0x3F);
                    substr = substr + String.fromCharCode(widechar);
                }
                else {
                    b = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    c = str1.substr(1, 2);
                    str1 = str1.substr(3, str1.length - 3);
                    var widechar = (parseInt("0x" + a) & 0x0F) << 12;
                    widechar = widechar | ((parseInt("0x" + b) & 0x3F) << 6);
                    widechar = widechar | (parseInt("0x" + c) & 0x3F);
                    substr = substr + String.fromCharCode(widechar);
                }
            }
            else {
                substr = substr + str1.substring(0, i);
                str1 = str1.substring(i);
            }
            i = str1.indexOf("%");
        }

        return substr + str1;
    }
};
router.get('/login', function (req, res) {
    var no = req.query.name
    var grade = req.query.grade
    var pwd = req.query.password

    if (read_conf_done == false) {
        //ï¿½ï¿½È¡ï¿½ï¿½ï¿½ï¿½ï¿½Ä¼ï¿½ï¿½ï¿½ï¿½ï¿½
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
            //console.log(res_json[0].stu_name)
            //res_json[0].stu_name = iconv.encode(res_json[0].stu_name,'utf-8')
            //res_json[0].stu_name = iconv.decode(Buffer.concat(res_json[0]).stu_name,'utf-8')
            //console.log('11111111111')
            //console.log(res_json[0].stu_name)
            var tt = 'ÎÒÈÕÕâ¸öÊÀ½ç'
            tt = GB2312UTF8.GB2312ToUTF8(tt);
            //console.log(tt)
            var msg = {
                user: res_json[0],
                conf: conf
            };
            if (msg.user.stu_userlevel > '0') {//ï¿½ï¿½Ê¦ï¿½ï¿½Ø¶ï¿?1?71ï¿?1?77
                if (msg.user.stu_enable == '1') {//ï¿½Ðµï¿½Â¼È¨ï¿½ï¿½
                    var md5 = crypto.createHash('md5');
                    var result = md5.update(msg.user.stu_no).digest('hex');
                    if (msg.user.stu_password !== result) {
                        var query2 = "select * from student where stu_userlevel='0' and stu_enable='1'"
                        console.log(query2)
                        connection.query(query2, function (err, resu) {
                            var all_stu = JSON.parse(JSON.stringify(resu));
                            var msg = {
                                user: res_json[0],
                                conf: conf,
                                stu: all_stu
                            }
                            res.render("server", { msg }, (err, data) => {
                                if (err){
                                    console.log(err)
                                    return 
                                }
                                res.send(data);
                            })
                        })
                    }
                    else {
                        res.render("changePwd", { msg }, (err, data) => {
                            res.send(data);
                        })
                    }
                }
            }
            else {//Ñ§ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½Ó¶ï¿½
                if (msg.user.stu_enable == '1') {//ï¿½Ðµï¿½Â¼È¨ï¿½ï¿½
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
            //res.redirect('/login.html');//ï¿½Ë»ï¿½ï¿½ï¿½ï¿½Úµï¿½ï¿½ï¿½ï¿½ï¿½Ä³Ð©Ô­ï¿½ï¿½ï¿½Þ·ï¿½ï¿½ï¿½Â¼
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
