var auth = require('basic-auth')
var http = require('http')
var nodeStatic = require('node-static')

module.exports = function(config) {
  var file = new nodeStatic.Server(config.root, config.options)
  var port = process.env.PORT || config.port
  var username = config.username
  var password = config.password

  http.createServer(function(request, response){
    var credentials = auth(request)
    var unauthenticated = !credentials || credentials.name !== username || credentials.pass !== password
    
    if (request.headers["x-forwarded-proto"] !== "https") {
      response.writeHead(301, { "Location": "https://" + request.headers["host"] + request.url })
      response.end()
    } else {
      if (unauthenticated && process.env.NODE_ENV == 'production') {
        response.writeHead(401, {
          'WWW-Authenticate': 'Basic realm="' + config.realm + '"'
        })
        response.end()
      } else {
        request.addListener('end', function () {
          file.serve(request, response, function (e, res) {
            if (e && (e.status === 404)) { // If the file wasn't found
              file.serveFile('/index.html', 200, {}, request, response);
            }
          });
        }).resume()
      }
    }
  }).listen(port)
}
