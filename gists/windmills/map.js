
function Map(elementIdSelector) {

    this.mapSelector = elementIdSelector;

    this.WINDMILL_SVG = '<svg class="windmill" version="1.1" viewBox="0 0 512 512">' +
        '<path id="tower" d="M279,459c-9,0-18,0-36,0s9-225,9-225h18C270,234,297,459,279,459z"/>' +
        '<g id="propellers">' +
        '<path d="M261,234c0,0-27-36-27-54s9-126,18-126s9,9,9,18C261,103.272,261,234,261,234z"/>' +
        '<path d="M261,234c0,0-17.677,41.382-33.266,50.382s-113.619,55.206-118.119,47.411C105.115,324,112.91,319.5,120.704,315C147.786,299.363,261,234,261,234z"/>' +
        '<path d="M261,234.055c0,0,44.677-5.382,60.266,3.618s104.619,70.794,100.119,78.589c-4.5,7.793-12.294,3.293-20.089-1.207C374.214,299.418,261,234.055,261,234.055z"/>' +
        '<circle cx="261" cy="234" r="27"/></g></svg>';

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

        map.svg = d3.select(map.mapSelector).select('.base').append('svg')
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

        //var lyrData = d3.select(map.mapSelector).select('.data');
        var SVG = '<svg class="marker" viewBox="0 0 120 120" version="1.1"><circle cx="60" cy="60" r="50"/></svg>';
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

                var capacity = Number(dt.GeneratingCapacity.replace(' MW', ''));
                var secs = 1 / capacity;

                console.log('Farm: ' + dt.GeneratingCapacity + ' - ' + secs + 's');

                var pos = map.projection([lon, lat]);
                var posStr = 'left: ' + (pos[0] - 24) + '; top: ' + (pos[1] - 42) + ';';
                // put an svg element in the right place...
                /*$(SVG).attr({
                    'width': '24px',
                    'height': '24px',
                    'style': posStr
                }).appendTo(map.mapSelector + ' .data');
                */
                var windmill = $(map.WINDMILL_SVG);
                $(windmill).attr({
                    'style': posStr
                });
                $(windmill).find('#propellers').attr({
                    'style': 'animation: spin ' + secs + 's linear infinite;'
                });
                windmill.appendTo(map.mapSelector + ' .data');
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
