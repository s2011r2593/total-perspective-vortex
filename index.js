import { State } from "perspective-vortex";
import * as wasm from "perspective-vortex";

var canvas = document.getElementById('dispcanv');
canvas.width = window.innerWidth;
canvas.height = canvas.parentElement.clientHeight;
var ctx = canvas.getContext('2d');

var state = null;
var transposedPoints = [];

function defaultTPV() {
    fetch('https://gist.githubusercontent.com/s2011r2593/5c2c34b5218dfa50e7989aa68b4e408e/raw/4a2a7be24b29ad6d5b58ae1f34905e40d1f0113b/defaulttpv.csv')
        .then(res => res.blob())
        .then(blob => {
            blob.text()
                .then(text => {
                    text = text.replace(/(\r)/gm, "");
                    text = text.split("\n");
                    for (let i = 0; i < text.length; i++) {
                        text[i] = text[i].split(",");
                        text[i] = text[i].map(Number);
                    }
                    transposedPoints = text[0].map((_, colIndex) => text.map(row => row[colIndex]));
                })
                .then(() => {
                    initState(transposedPoints, scaleAirfoil)
                })
        })
        .catch(err => {
            console.error(`Unable to fetch default airfoil: [${err}]`);
        })
}
defaultTPV();

function normalizeAirfoil(p) {
    let points = p.slice();
    for (let i = 0; i < points.length; i++) {
        points[0][i] /= Math.max(points[0]);
        points[1][i] /= Math.max(points[0]);
    }
    return points;
}

function scaleAirfoil() {
    let canvAR = canvas.width / canvas.height;
    let afAR = (Math.max.apply(Math, transposedPoints[0]) - Math.min.apply(Math, transposedPoints[0])) / (Math.max.apply(Math, transposedPoints[1]) - Math.min.apply(Math, transposedPoints[1]));
    // If canvAR > afAR, base drawing on canv height
    // If canvAR < afAR, base drawing on canv width
    let yTrans = (canvas.height / 2);
    if (canvAR < afAR) {
        for (let i = 0; i < transposedPoints[0].length; i++) {
            transposedPoints[0][i] *= canvas.width * 0.5;
            transposedPoints[1][i] *= canvas.width * -0.5;
        }
        let xTrans = (canvas.width / 2) - (Math.max.apply(Math, transposedPoints[0]) / 2);
        for (let i = 0; i < transposedPoints[0].length; i++) {
            transposedPoints[0][i] += xTrans;
            transposedPoints[1][i] += yTrans;
        }
        draw();
    }
    else {
        var yAdj = Math.max.apply(Math, transposedPoints[1]) - Math.min.apply(Math, transposedPoints[1]);
        for (let i = 0; i < transposedPoints[0].length; i++) {
            transposedPoints[0][i] /= yAdj;
            transposedPoints[1][i] /= yAdj;
            transposedPoints[0][i] *= canvas.height * 0.6;
            transposedPoints[1][i] *= canvas.height * -0.6;
        }
        let xTrans = (canvas.width / 2) - (Math.max.apply(Math, transposedPoints[0]) / 2);
        for (let i = 0; i < transposedPoints[0].length; i++) {
            transposedPoints[0][i] += xTrans;
            transposedPoints[1][i] += yTrans;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;
    ctx.fillStyle = '#ebebeb';
    ctx.strokeStyle = '#ebebeb';
    ctx.beginPath();
    ctx.moveTo(transposedPoints[0][0], transposedPoints[1][0]);
    for (let i = 1; i < transposedPoints[0].length; i++) {
        ctx.lineTo(transposedPoints[0][i], transposedPoints[1][i]);
    }
    ctx.closePath();
    ctx.stroke();
}

function readCsv(event) {
    var f = event.target.files[0];
    if (f) {
        var r = new FileReader();
        r.readAsText(f);
        r.onload = (e) => {
            var contents = e.target.result;
            contents = contents.replace(/(\r)/gm, "");
            var arr = contents.split("\n");
            for (let i = 0; i < arr.length; i++) {
                arr[i] = arr[i].split(",");
                arr[i] = arr[i].map(Number);
            }
            transposedPoints = arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
        };
    }
}

function initState(tp, callback) {
    state = State.new(
        tp[0],
        tp[1],
        document.getElementById('q_inf').value,
        document.getElementById('rho_inf').value,
        document.getElementById('p_inf').value,
        document.getElementById('aoa').value
    );
    callback();
}

function logPoints() {
    state.log_points();
    state.gauss_elim();
}

document.getElementById('csvupload').addEventListener('change', readCsv);
document.getElementById('btn1').addEventListener('click', function() {initState(transposedPoints.slice(), scaleAirfoil);});
document.getElementById('btn2').addEventListener('click', logPoints);
