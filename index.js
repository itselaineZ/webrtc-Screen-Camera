var express = require('express');
var Buffer = require('buffer');
var app = express();
var http = require('http').createServer(app);
var saveRouter = require('./save');

app.use('/',saveRouter);

var fs = require('fs');
let sslOptions = {
    key: fs.readFileSync('./private.pem'),//������ļ��滻�������ɵ�˽Կ
    cert: fs.readFileSync('./server.csr')//������ļ��滻�������ɵ�֤��
};

const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

app.get('/camera', (req, res) => {
    res.sendFile(__dirname + '/camera.html');
});

app.get('/server', (req, res) => {
    res.sendFile(__dirname + '/server.html');
});

io.on("connection", (socket) => {
    //���Ӽ����ӷ���
    socket.join( socket.id );

    console.log("a user connected " + socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        //ĳ���û��Ͽ����ӵ�ʱ��������Ҫ�������л����ߵ��û������Ϣ
        socket.broadcast.emit('user disconnected', socket.id);
    });

    socket.on("chat message",(msg) => {
        console.log(socket.id + " say: " + msg);
        //io.emit("chat message", msg);
        socket.broadcast.emit("chat message", msg);
    });

    //�������û����룬���к�ʱ����Ҫת����Ϣ�����������û���
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.broadcast.emit('need connect', {sender: socket.id, msg : data.msg});
    });
    //�����û���Ӧ���û���Ϣ��ת��
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender : data.sender});
    });

    //sdp ��Ϣ��ת��
    socket.on( 'sdp', ( data ) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to( data.to ).emit( 'sdp', {
            description: data.description,
            sender: data.sender
        } );
    } );

    //candidates ��Ϣ��ת��
    socket.on( 'ice candidates', ( data ) => {
        console.log('ice candidates:  ');
        console.log(data);
        socket.to( data.to ).emit( 'ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        } );
    } );

});


https.listen(80, () => {
    console.log('https listening on *:80');
});

module.exports = app;
