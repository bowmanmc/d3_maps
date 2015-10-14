
function HawaiiMap(elementIdSelector) {

    this.mapSelector = elementIdSelector;

    this.drawMap = function() {

        var map = this;

        var el = $(map.mapSelector)[0];
        if (typeof el === 'undefined') {
            console.log('ERROR - No element matching: ' + this.mapSelector);
            return;
        }

        //var width = 1600,
        //    height = 1024;
        map.height = el.clientHeight;
        map.width = (1600 / 1024) * map.height;
        console.log('Making map size: ' + map.width + 'x' + map.height);

        map.projection = d3.geo.mercator().translate([map.width / 2, map.height / 2]);
        map.projection = d3.geo.albersUsa().translate([map.width / 2, map.height / 2]);

        map.path = d3.geo.path().projection(map.projection);

        map.svg = d3.select(map.mapSelector).append('svg')
            .attr('width', map.width)
            .attr('height', map.height);

        map.bg = map.svg.append('g');
        map.fg = map.svg.append('g');

        this.drawState();
    };

    this.drawState = function() {

        var map = this;
        d3.json('state.hi.json', function(error, response) {

            map.projection.scale(1).translate([0, 0]);

            var b = map.path.bounds(response),
                s = 0.95 / Math.max((b[1][0] - b[0][0]) / map.width, (b[1][1] - b[0][1]) / map.height),
                t = [(map.width - s * (b[1][0] + b[0][0])) / 2, (map.height - s * (b[1][1] + b[0][1])) / 2];

            map.projection.scale(s).translate(t);

            map.bg.selectAll('path')
                .data(response.features)
                .enter().append('path')
                .attr('class', 'shadow')
                .attr('d', map.path);

            map.fg.selectAll('path')
                .data(response.features)
                .enter().append('path')
                .attr('id', function(d, i) {
                    return d.properties['NAME'];
                })
                .attr('class', 'state')
                .attr('d', map.path);

        });

    };

}; // HawaiiMap
