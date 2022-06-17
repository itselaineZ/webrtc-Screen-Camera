var express = require('express');
var formidable = require('formidable');
var fs = require('fs')
var path = require('path');
var router = express.Router();

/*router.post('/saveVideo', function (req, res) {
    // { filetitle, filedata }
    var form = new formidable.IncomingForm();
    console.log(form)
    form.uploadDir = '/root/webrtc-Screen-Camera';
    form.parse(req, function (err, fields, files) {
      console.log(files)
//	  console.log(fields)
        if (err) {
            res.json({ 'result': '-1', 'msg': 'save failed' })
            return
        }
        var oldpath = files.filedata.path;
        var newpath = oldpath + fields.filetitle;
        //newpath�������޸��ļ�������ΪĬ�ϱ�����ļ���û�к�׺��
        //δ�޸��ļ���ʱ�����ӣ�upload_7bd3302059acb15419974e2907b099fd

        // fs.rename(oldpath, newpath, (err) => {
        //     //�ı��ϴ��ļ��Ĵ��λ�ú��ļ���
        //     if (err) {
        //         res.json({ 'result': '-2', 'msg': 'save failed' })
        //         return
        //     }
        //     res.json({ 'result': '0', 'msg': 'save success' })
        // })
    });
    form.on('error', function (err) {
        console.log('upload error:', err)
        res.json({ 'result': '-3', 'msg': 'save failed' })
    });
    // fs.writeFile(pth, recorderFile, {}, (err, res) => {
    //     if (err) {
    //         console.log(err)
    //         return
    //     }
    //     console.log('video saved!')
    // })
})*/
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

