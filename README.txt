#webrtc-Screen-Camera

TJCS NetWork

#2022/5/15 中期检查改进要求

视频要存储在服务器里，server只监视用

帧率、摄像头分辨率和设置冲突

网速、连接人数和帧率优化问题

chrome 客户端录屏解决

#https证书生成

openssl genrsa -out privkey.pem 2048 在当前目录下生成私钥

openssl req -new -x509 -key privkey.pem -out cacert.pem -days 1095 证书生成


