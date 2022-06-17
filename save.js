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
        //newpath：用于修改文件名，因为默认保存的文件是没有后缀的
        //未修改文件名时的例子：upload_7bd3302059acb15419974e2907b099fd

        // fs.rename(oldpath, newpath, (err) => {
        //     //改变上传文件的存放位置和文件名
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