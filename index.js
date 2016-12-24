var auth = require('basic-auth')
var http = require('http')
var nodeStatic = require('node-static')

module.exports = function(config) {
  var file = new nodeStatic.Server(config.root, config.options)
  var port = process.env.PORT || config.port
  var username = config.username
  var password = config.password

  http.createServer(function(req, res){
    var credentials = auth(req)
    var unauthenticated = !credentials || credentials.name !== username || credentials.pass !== password
    if (unauthenticated && process.env.NODE_ENV == 'production') {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="' + config.realm + '"'
      })
      res.end()
    } else {
      req.addListener('end', function () {
        file.serve(req, res, function (e, res) {
          if (e && (e.status === 404)) { // If the file wasn't found
            file.serveFile('/index.html', 200, {}, req, res);
          }
        });
      }).resume()
    }
  }).listen(port)
}
