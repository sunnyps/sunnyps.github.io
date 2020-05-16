document.addEventListener("DOMContentLoaded", function () {
    var shuffle = function (a) {
        var r = a.slice(0, a.length);
        for (var i = r.length - 1; i >= 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = r[i];
            r[i] = r[j];
            r[j] = temp;
        }
        return r;
    };
    var ticket = [];
    while (true) {
        var selectedCols = [];
        for (var i = 0; i < 3; i++) {
            selectedCols[i] = Array.from(Array(9).keys());
            selectedCols[i] = shuffle(selectedCols[i]);
            selectedCols[i] = selectedCols[i].slice(0, 5);
        }
        var valid = true;
        var colRows = [];
        for (var j = 0; j < 9; j++) {
            colRows[j] = [];
            for (var i = 0; i < 3; i++) {
                if (selectedCols[i].indexOf(j) != -1) {
                    colRows[j].push(i);
                }
            }
            if (colRows[j].length > 2 || colRows[j].length == 0) {
                valid = false;
                break;
            }
        }
        if (valid) {
            for (var i = 0; i < 3; i++) {
                ticket[i] = Array(9).fill(0);
            }
            var _loop_1 = function (j) {
                var vals = Array.from(Array(10).keys()).map(function (v) { return 10 * j + (v + 1); });
                vals = shuffle(vals);
                vals = vals.slice(0, colRows[j].length);
                vals = vals.sort(function (a, b) { return (a - b); });
                for (var r = 0; r < colRows[j].length; r++) {
                    var i = colRows[j][r];
                    ticket[i][j] = vals[r];
                }
            };
            for (var j = 0; j < 9; j++) {
                _loop_1(j);
            }
            break;
        }
    }
    var table = document.getElementById("ticket");
    var body = table.createTBody();
    for (var i = 0; i < 3; i++) {
        var row = body.insertRow();
        for (var j = 0; j < 9; j++) {
            var cell = row.insertCell();
            if (ticket[i][j] > 0)
                cell.textContent = String(ticket[i][j]);
        }
    }
});
