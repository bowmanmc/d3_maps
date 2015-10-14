
function Map(elementIdSelector) {

    this.mapSelector = elementIdSelector;

    this.drawMap = function() {

        var map = this;
        var el = $(map.mapSelector)[0];

        //var width = 960,
        //    height = 1200;
        map.height = el.clientHeight;
        map.width = el.clientWidth;
        console.log('Making map size: ' + map.width + 'x' + map.height);

        //map.projection = d3.geo.albersUsa();
        map.projection = d3.geo.conicConformal();

        map.path = d3.geo.path().projection(map.projection);

        map.svg = d3.select(map.mapSelector).append('svg')
            .attr('width', map.width)
            .attr('height', map.height);

        map.lyrLand = map.svg.append('g');
        map.lyrData = map.svg.append('g');

        //map.loadStates().then(function(us) {
        //    map.drawStates(us);
        map.loadState().then(function(oh) {
            map.drawState(oh);
            map.loadData().then(function(data) {
                map.drawData(data);
            });
        });
    };

    this.loadState = function() {
        var deferred = $.Deferred();
        d3.json('state.oh.json', function(error, response) {
            deferred.resolve(response);
        });
        return deferred.promise();
    };

    this.drawState = function(oh) {
        var map = this;

        var centroid = d3.geo.centroid(oh.features[0]);
        var r = [centroid[0] * -1, centroid[1] * -1];
        console.log('Rotate: ' + JSON.stringify(r));
        map.projection.scale(1).translate([0, 0]).rotate(r);

        var b = map.path.bounds(oh),
            s = 0.95 / Math.max((b[1][0] - b[0][0]) / map.width, (b[1][1] - b[0][1]) / map.height),
            t = [(map.width - s * (b[1][0] + b[0][0])) / 2, (map.height - s * (b[1][1] + b[0][1])) / 2];

        map.bounds = d3.geo.bounds(oh.features[0]);
        map.projection.scale(s).translate(t);

        map.lyrLand.selectAll('path')
            .data(oh.features)
            .enter().append('path')
            .attr('class', 'land')
            .attr('d', map.path);
    };

    this.loadStates = function() {
        var deferred = $.Deferred();
        d3.json('us.json', function(error, response) {
            deferred.resolve(response);
        });
        return deferred.promise();
    };

    this.drawStates = function(us) {
        var map = this;
        map.lyrLand.insert('path')
            .datum(topojson.feature(us, us.objects.states))
            .attr('class', 'land')
            .attr('d', map.path);
    };

    this.loadData = function() {
        var deferred = $.Deferred();
        d3.csv('windfarms.csv', function(error, response) {
            deferred.resolve(response);
        });
        return deferred.promise();
    };

    this.drawData = function(data) {
        var map = this;

        var minLat = map.bounds[0][1];
        var maxLat = map.bounds[1][1];
        var minLon = map.bounds[0][0];
        var maxLon = map.bounds[1][0];

        var ohioData = [];
        var i, dt, coords, lat, lon;
        var len = data.length;
        for (i = 0; i < len; i++) {
            dt = data[i];
            coords = dt.Coordinates.split(',');
            lat = parseFloat(coords[0].replace('°', ''));
            lon = parseFloat(coords[1].replace('°', ''));
            if ((lat >= minLat && lat <= maxLat) &&
                (lon >= minLon && lon <= maxLon)) {
                ohioData.push(dt);
            }
        }

        map.lyrData.selectAll('circle')
            .data(ohioData)
            .enter().append('circle')
            .attr('r', 3)
            .attr('class', 'windmill')
            .attr('transform', function(d) {
                var coords = d.Coordinates.split(',');
                var lat = coords[0].replace('°', '');
                var lon = coords[1].replace('°', '');
                var transform = map.projection([lon, lat]);
                if (transform !== null) {
                    return 'translate(' + transform + ')';
                }
                console.log('Bad Coordinates: ' + d.Coordinates + ' -> ' + transform);
                return 'translate(-1000000, -1000000)';
            });
    };
}
