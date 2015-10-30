
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

        map.height = el.clientHeight;
        map.width = el.clientWidth;

        map.projection = d3.geo.albersUsa();
        //map.projection = d3.geo.conicConformal();

        map.path = d3.geo.path().projection(map.projection);

        map.svg = d3.select(map.mapSelector).select('.base').append('svg')
            .attr('width', map.width)
            .attr('height', map.height);

        map.lyrLand = map.svg.append('g');
        map.lyrData = map.svg.append('g');

        map.loadStates().then(function(us) {
            map.drawStates(us);
            map.loadData().then(function(data) {
                map.drawData(data);
            });
        });
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

        var extent = d3.extent(data, function(d, i) {
            if (isNaN(d.capacityNum)) {
                console.log('BAD: ' + d.GeneratingCapacity);
                return 0;
            }
            // coerce into numeric
            return +d.capacityNum;
        }).reverse();

        console.log('EXTENT: ' + JSON.stringify(extent));

        var scale = d3.scale.linear().clamp(true).domain([1000, 0]).range([0.25, 5]);

        var i, dt, secs;
        var len = data.length;
        for (i = 0; i < len; i++) {
            dt = data[i];
            if (dt.capacityNum < 0 || isNaN(dt.capacityNum)) {
                dt.capacityNum = 0;
            }

            secs = scale(dt.capacityNum);
            if (dt.capacityNum > 1000) {
                console.log('    ' + dt.capacityNum + ' -> ' + secs);
            }

            var pos = map.projection([dt.lon, dt.lat]);
            if (pos === null) {
                continue;
            }
            // offsets depend on size of windmill in styles.css
            //var offsetX = 24;
            var offsetX = 8;
            //var offsetY = 42;
            var offsetY = 13;
            var posStr = 'left: ' + (pos[0] - offsetX) + '; top: ' + (pos[1] - offsetY) + ';';

            // put an svg element in the right place...
            var windmill = $(map.WINDMILL_SVG);
            $(windmill).attr({
                'style': posStr
            });
            $(windmill).find('#propellers').attr({
                'style': 'animation: spin ' + secs + 's linear infinite;'
            });
            windmill.appendTo(map.mapSelector + ' .data');
        }

        // debug code to draw circles at the coords
        // map.lyrData.selectAll('circle')
        //     .data(data)
        //     .enter().append('circle')
        //     .attr('r', 3)
        //     .attr('transform', function(d) {
        //         var transform = map.projection([d.lon, d.lat]);
        //         if (transform !== null) {
        //             return 'translate(' + transform + ')';
        //         }
        //         console.log('Bad coordinates "' + d.coords + '" - "' + transform + '"');
        //         return 'translate(-100000, -100000)';
        //     });
    };
}
