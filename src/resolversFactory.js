var util = require('util');
var http = require('http');
var peliasConfig = require( 'pelias-config' ).generate();


function createWofPipResolver(url, config) {
  config = config || peliasConfig;

  var maxConcurrentReqs = 1;
  if (config.imports.adminLookup && config.imports.adminLookup.maxConcurrentReqs) {
    maxConcurrentReqs = config.imports.adminLookup.maxConcurrentReqs;
  }

  http.globalAgent.maxSockets = maxConcurrentReqs;

  return function(centroid, callback) {
    var requestUrl = util.format('%s/?latitude=%d&longitude=%d', url, centroid.lat, centroid.lon);

    http.get(requestUrl, function(response) {
      var contents = '';

      response.setEncoding('utf8');
      response.on('data', function(data) { contents += data; } );
      response.on('end', function() {
        // convert the array to an object keyed on the array element's Placetype field
        var result = JSON.parse(contents).reduce(function(obj, elem) {
          if (!obj.hasOwnProperty(elem.Placetype)) {
            obj[elem.Placetype] = [];
          }
          obj[elem.Placetype].push({
            id: elem.Id,
            name: elem.Name
          });
          return obj;
        }, {});

        return callback(null, result);

      });

    }).on('error', function(err) {
      return callback(err, null);
    });

  };

}

module.exports = {
  createWofPipResolver: createWofPipResolver
};
