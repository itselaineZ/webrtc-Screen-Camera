var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var router = express.Router();

router.post('/saveVideo', function (req, res) {
    // { filetitle, filedata }
    var form = new formidable.IncomingForm();
    form.uploadDir = '/root/webrtc-Screen-Camera';
    form.parse(req, function (err, fields, files) {
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
})

module.exports = router;