var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var app = express();
var fs = require('fs')
var path = require('path');


var http = require('http').createServer(app);

var saveRouter = require('./save');
var loginRouter = require('./login');


var fs = require('fs');
let sslOptions = {
    key: fs.readFileSync('./private.pem'),//里面的文件替换成你生成的私钥
    cert: fs.readFileSync('./server.csr')//里面的文件替换成你生成的证书
};

const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);

app.set('views', "public");	//设置视图的对应目录
app.set("view engine", "ejs");		//设置默认的模板引擎
app.engine('ejs', ejs.__express);		//定义模板引擎


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', saveRouter);
app.use('/', loginRouter);



io.on("connection", (socket) => {
    //连接加入子房间
    socket.join(socket.id);

    console.log("a user connected " + socket.id);


    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        socket.broadcast.emit('user disconnected', socket.id);
    });

    socket.on("reset", () => {
        socket.broadcast.emit("user reset", socket.id);
    });

    //当有新用户加入，打招呼时，需要转发消息到所有在线用户。
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.emit('index need connect',
            {
                sender: socket.id, msg: data.msg
            });
    });
    socket.on('server on', (socket_id) => {
        console.log('server on' + socket_id)
        socket.broadcast.emit('server ready', socket_id)
    })
    socket.on('user ready', (data) => {
        console.log('user ready' + data.sender)
        socket.broadcast.emit('need connect', {
            sender: socket.id, msg: data.msg
        })
    })
    //在线用户回应新用户消息的转发
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', { sender: data.sender });
    });

    socket.on('stop track send', (socket_id)=>{
        socket.broadcast.emit('stop track send', socket_id)
    })

    //sdp 消息的转发
    socket.on('sdp', (data) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to(data.to).emit('sdp', {
            description: data.description,
            sender: data.sender
        });
    });

    //candidates 消息的转发
    socket.on('ice candidates', (data) => {
        console.log('ice candidates:  ');
        console.log(data);
        socket.to(data.to).emit('ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        });
    });

});



https.listen(80, () => {
    console.log('https listening on *:80');
});

module.exports = app;
