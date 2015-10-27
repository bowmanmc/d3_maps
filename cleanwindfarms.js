
var d3 = require('d3');
var fs = require('fs');


fs.readFile('data/windfarms-original.csv', 'utf-8', function(error, data) {
    var orig = d3.csv.parse(data);
    var farms = [];
    var i, dt, coords, lat, lon;
    var len = orig.length;
    for (i = 0; i < len; i++) {
        dt = orig[i];
        dt.capacityNum = Number(dt.GeneratingCapacity.replace(' MW', '').replace(',',''));
        if (dt.capacityNum > 100) {
            console.log('    ' + dt.GeneratingCapacity + ' -> ' + dt.capacityNum);
        }
        coords = dt.Coordinates.split(',');
        dt.lat = parseFloat(coords[0].replace('°', ''));
        dt.lon = parseFloat(coords[1].replace('°', ''));

        farms.push(dt);
    }

    console.log('Farm: ' + JSON.stringify(farms[0]));

    // write it back out...
    fs.writeFile('data/windfarms.csv', d3.csv.format(farms));
});
