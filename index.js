var express = require('express');
var Buffer = require('buffer');
var cors = require('cors');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var app = express();
var http = require('http').createServer(app);

var saveRouter = require('./save');
var loginRouter = require('./login');

//app.use(cors()) //��������

var fs = require('fs');
let sslOptions = {
    key: fs.readFileSync('./private.pem'),//������ļ��滻�������ɵ�˽Կ
    cert: fs.readFileSync('./server.csr')//������ļ��滻�������ɵ�֤��
};

const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);

var path = require('path');
app.set('views',"public");	//������ͼ�Ķ�ӦĿ¼
app.set("view engine","ejs");		//����Ĭ�ϵ�ģ������
app.engine('ejs', ejs.__express);		//����ģ������


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',saveRouter);
app.use('/',loginRouter);

/*
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });
app.get('/camera', (req, res) => {
    res.sendFile(__dirname + '/camera.ejs');
});

app.get('/server', (req, res) => {
    res.sendFile(__dirname + '/server.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });
*/

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
