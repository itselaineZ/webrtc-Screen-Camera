var express = require('express');
var formidable = require('formidable');
var fs = require('fs')
var path = require('path');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'ZXYgyt216216@',
    database: 'user'
})
connection.connect()

router.post('/saveVideo', function (req, res) {
    console.log(path.join(__dirname, '../'))
    //console.log(request)
    //const form=new formidable.IncomingForm({uploadDir:"/root"});
    const form = formidable({
        uploadDir: path.join(__dirname, '../'), // �ϴ��ļ����õ�Ŀ¼
        keepExtensions: true,           //����Դ�ļ�����չ��
        multiples: true                 //����ļ��ı���
    })
    form.parse(req, (err, fields, files) => {
        if (err) {
            res.json({ 'result': '-1', 'msg': 'save failed' })
            return
        }
        // res.json({      //��Ӧjson����
        //     code: 200,
        //     data: { fields, files }
        // })
        console.log(files);
        console.log(fields);
        var oldpath = files.content.filepath;
        console.log('old:::::' + oldpath)
        var newpath = '/root/' + fields.title;
        console.log('new:::::' + newpath);
        fs.access(newpath, fs.constants.F_OK, (err)=> {
            if (err) {
                console.log('not have one')
                fs.rename(oldpath, newpath, (err) => {
                    //�ı��ϴ��ļ��Ĵ��λ�ú��ļ���
                    if (err) {
                        res.json({ 'result': '-2', 'msg': 'save failed' })
                    }
                    res.json({ 'result': '0', 'msg': 'save success' })
                })
            } else {
                console.log('already have')
                fs.appendFile(newpath, files, function (err) {
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

