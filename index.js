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

//app.use(cors()) //跨域问题

var fs = require('fs');
let sslOptions = {
    key: fs.readFileSync('./private.pem'),//里面的文件替换成你生成的私钥
    cert: fs.readFileSync('./server.csr')//里面的文件替换成你生成的证书
};

const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);

var path = require('path');
app.set('views',"public");	//设置视图的对应目录
app.set("view engine","ejs");		//设置默认的模板引擎
app.engine('ejs', ejs.__express);		//定义模板引擎


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
    //连接加入子房间
    socket.join( socket.id );

    console.log("a user connected " + socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        //某个用户断开连接的时候，我们需要告诉所有还在线的用户这个信息
        socket.broadcast.emit('user disconnected', socket.id);
    });

    socket.on("chat message",(msg) => {
        console.log(socket.id + " say: " + msg);
        //io.emit("chat message", msg);
        socket.broadcast.emit("chat message", msg);
    });

    //当有新用户加入，打招呼时，需要转发消息到所有在线用户。
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.broadcast.emit('need connect', {sender: socket.id, msg : data.msg});
    });
    //在线用户回应新用户消息的转发
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender : data.sender});
    });

    //sdp 消息的转发
    socket.on( 'sdp', ( data ) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to( data.to ).emit( 'sdp', {
            description: data.description,
            sender: data.sender
        } );
    } );

    //candidates 消息的转发
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
