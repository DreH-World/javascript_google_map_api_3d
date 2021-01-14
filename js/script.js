// var MaxR = 6378137.0;        // Earth Major Axis (WGS84)
// var MinR = 6356752.3142;     // Minor Axis
var MaxR = 6378137.0;
var MinR = 6356752.3142;

// function calculateDistance(lng1, lat1, lng2, lat2) {
//     //radians
//     lat1 = (lat1 * 2.0 * Math.PI) / 60.0 / 360.0;
//     lng1 = (lng1 * 2.0 * Math.PI) / 60.0 / 360.0;
//     lat2 = (lat2 * 2.0 * Math.PI) / 60.0 / 360.0;
//     lng2 = (lng2 * 2.0 * Math.PI) / 60.0 / 360.0;
//
//     // use to different earth axis length
//     // var a = 6378137.0;        // Earth Major Axis (WGS84)
//     // var b = 6356752.3142;     // Minor Axis
//
//     var a = MaxR;
//     var b = MinR;
//
//     var f = (a-b) / a;        // "Flattening"
//     var e = 2.0*f - f*f;      // "Eccentricity"
//
//     var beta = (a / Math.sqrt( 1.0 - e * Math.sin( lat1 ) * Math.sin( lat1 )));
//     var cos = Math.cos( lat1 );
//     var x = beta * cos * Math.cos( lng1 );
//     var y = beta * cos * Math.sin( lng1 );
//     var z = beta * ( 1 - e ) * Math.sin( lat1 );
//
//     beta = ( a / Math.sqrt( 1.0 -  e * Math.sin( lat2 ) * Math.sin( lat2 )));
//     cos = Math.cos( lat2 );
//     x -= (beta * cos * Math.cos( lng2 ));
//     y -= (beta * cos * Math.sin( lng2 ));
//     z -= (beta * (1 - e) * Math.sin( lat2 ));
//
//     return Math.sqrt( (x*x) + (y*y) + (z*z) );
// }

var R = 6371000; // m



// Converts numeric radians to degrees
function toDeg(Value)
{
    return Value * 180 / Math.PI;
}


class CoordinateSystem {

    /************************
     * Geographic Coordinate System, GCS
     *
     * position has [x, y] format
     * point has [lng, lat] format
     * landmark1 (zeroMark) is for zero point of custom coordinate system
     * landmark2 (alphaMark) is point to indicate direction
     *
    *************************/

    // set landmark 1 and landmark 2
    // zeroMark: array
    // alphaMark: array
    constructor(zeroMark, alphaMark, directionY='left') {
        this.zeroMark = zeroMark;
        this.alphaMark = alphaMark;
        this.setAlpha(alphaMark);
        if(directionY == 'left') {
            this.directionY = 1;
        }
        else {
            this.directionY = -1;
        }
    }

    setAlpha(alphaMark) {
        this.alpha = this.getBasicAlpha(alphaMark);
    }

    setZeroMark(zeroMark) {
        this.zeroMark = zeroMark;
        this.setAlpha(this.alphaMark);
    }

    getBasicPosition(point) {
        var vdX = Math.sign(point[0] - this.zeroMark[0]) * calculateDistance(this.zeroMark[0], this.zeroMark[1], point[0], this.zeroMark[1]);
        var vdY = Math.sign(point[1] - this.zeroMark[1]) * calculateDistance(this.zeroMark[0], this.zeroMark[1], this.zeroMark[0], point[1]);
        var lng = this.getLngFromVBX(vdX);
        var lat = this.getLatFromVBY(vdY);
        return [vdX, vdY];
    }

    getBasicAlpha(point) {
        var vbPosition = this.getBasicPosition(point);
        // var alpha = Math.atan(Math.abs(vbPosition[1] / vbPosition[0]));
        // if (vPosition[0] < 0 && vPosition[1] >= 0)
        //     alpha = Math.PI - alpha;
        // else if (vPosition[0] < 0 && vPosition[1] <0)
        //     alpha = alpha - Math.PI;
        // else if (vPosition[0] > 0 && vPosition[1] < 0)
        //     alpha = -1 * alpha;
        return Math.atan2(vbPosition[1], vbPosition[0]);
    }

    getCustomPosition(point) {
        var distance = calculateDistance(this.zeroMark[0], this.zeroMark[1], point[0], point[1]);
        var alpha = this.getBasicAlpha(point);
        // console.log('alpha 1', alpha);
        var customAlpha = alpha - this.alpha;
        var x = distance * Math.cos(customAlpha);
        var y = distance * Math.sin(customAlpha) * this.directionY;
        // console.log('distance1', distance);
        // console.log('x1', distance * Math.cos(alpha));
        // console.log('y1', distance * Math.sin(alpha));
        return [x, y];
    }

    getCustomDistance(point) {
        return calculateDistance(this.zeroMark[0], this.zeroMark[1], point[0], point[1]);
    }

    getCustomAlphaFromVCXY(vcPosition) {
        return Math.atan2(vcPosition[1], vcPosition[0]);
    }

    getBasicAlphaFromVCXY(vcPosition) {
        return this.getCustomAlphaFromVCXY(vcPosition) * this.directionY + this.alpha;
    }

    getBasicAlphaFromVCAlpha(alpha) {
        return alpha * this.directionY + this.alpha;
    }

    getPointFromVCXY(vcPosition) {
        var vbAlpha = Math.atan2(vcPosition[1], vcPosition[0]) * this.directionY + this.alpha;

        var distance = Math.sqrt(vcPosition[0] * vcPosition[0] + vcPosition[1] * vcPosition[1]);
        var vbX = distance * Math.cos(vbAlpha);
        var vbY = distance * Math.sin(vbAlpha);
        console.log('alpha 2', vbAlpha);
        console.log('distance2', distance);

        console.log('x2', vbX);
        console.log('y2', vbY);

        var lng = this.getLngFromVBX(vbX);
        var lat = this.getLatFromVBY(vbY);

        return [lng, lat];
    }

    getLatFromVBY(vbY) {
        var c = vbY / R;
        var a = Math.sin(c / 2) * Math.sin(c / 2);
        var dLat = Math.sign(c) * Math.asin(Math.sqrt(a)) * 2;
        return this.zeroMark[1] + toDeg(dLat);
    }

    getLngFromVBX(vbX) {
        var c = vbX / R;
        var a = Math.sin(c / 2) * Math.sin(c / 2);
        var lat1 = toRad(this.zeroMark[1]);
        var lat2 = toRad(this.zeroMark[1]);
        var dLng = Math.sign(c) * Math.asin(Math.sqrt(a / (Math.cos(lat1) * Math.cos(lat2)))) * 2;
        return this.zeroMark[0] + toDeg(dLng);

    }
}

function calculateDistance(lng1, lat1, lng2, lat2)
{
    var dLat = toRad(lat2-lat1);
    var dLng = toRad(lng2-lng1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}

class MapBoxCoordinateSystem extends CoordinateSystem {
    constructor(zeroMark, alphaMark, map) {
        super(zeroMark, alphaMark);
        this.map = map;
        this.drawSystemLines()
    }

}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}