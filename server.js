var express = require('express'),
    app = express();

app.use('/', express.static(__dirname + '/'));
app.use(express.bodyParser());
app.use(app.router);

app.get('/', function(req, res) {
    require('fs').readFile(__dirname + '/demo.html', 'utf-8',
        function(err, text) {
            res.send(text);
        });
});

/* 开始监听 */
app.listen(3033);
console.log("Chat server listen on port 3033");