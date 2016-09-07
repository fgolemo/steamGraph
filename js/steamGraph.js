var DIR = '../img/refresh-cl/';
var EDGE_LENGTH_MAIN = 150;
var EDGE_LENGTH_SUB = 50;

var currentNode = -1;
var currentEdges = [];
var node;

var currentMax = 0;
var currentMin = 0;

var storage = window['localStorage'];

$("#nodeInfos").hide();

function bla() {
//        for (var i = 1; i < 6; i++) {
//            var newVal = Math.floor(Math.random() * 10);
//            nodes.update([{id: i, value: newVal}]);
//        }
//        edges.update([{id: '1-2', value: -1}]);
    nodes.update([{id: 298110, value: 10}]);
}

function loadGameData() {
    $("#nodeInfos h3 a").text(node.label);
    $("#nodeInfos h3 a").attr('href', node.link);
    $("#steamrating").text(node.rating);
    $("#nodeInfos img").attr("src", "data/img/" + node.id + ".jpg");
    $("#currentRating").text(node.value);
}

function saveGraph() {
    $("#progress").text("saving...");
    storage.setItem('nodes', JSON.stringify(nodes.get()));
    storage.setItem('edges', JSON.stringify(edges.get()));
    $("#progress").text("saved. " + moment().calendar());
}

function loadGraph() {
    $("#progress").text("loading...");
    var nodesTmp = JSON.parse(storage.getItem('nodes'));
    var edgesTmp = JSON.parse(storage.getItem('edges'));

    nodes = new vis.DataSet(nodesTmp);
    edges = new vis.DataSet(edgesTmp);
    network.setData({nodes: nodes, edges: edges});

    $("#progress").text("loaded. " + moment().calendar());

    // var data = JSON.stringify(nodes.get());
    // var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
    // window.open(url, '_blank');
    // window.focus();

}

function gettop10() {
    var topNodes = nodes.get({
        order: function (a, b) {
            if (a.value > b.value) {
                return -1;
            } else if (a.value < b.value) {
                return 1;
            } else return 0;
        },
        filter: function (item) {
            return (item.rated === false);
        }

    });
    topNodes = topNodes.slice(0, 10);
    $('#top10 > tbody').empty();

    for (var i in topNodes) {
        $('#top10 > tbody:last-child').append('<tr><td>' + topNodes[i].label + '</td><td>' + topNodes[i].value + '</td></tr>');
    }

}

function hexFromRGBPercent(r, g, b) {
    var hex = [
        Math.floor((100 - r) / 100 * 255).toString(16),
        Math.floor((100 - g) / 100 * 255).toString(16),
        Math.floor((100 - b) / 100 * 255).toString(16)
    ];
    $.each(hex, function (nr, val) {
        if (val.length === 1) {
            hex[nr] = "0" + val;
        }
    });
    return "#" + hex.join("").toUpperCase();
}

function ratingToHex(rating) {
    if (rating == "b") {
        return "#000000";
    }

    var red = 0;
    var green = 0;
    var blue = 0;
    if (rating < 0) {
        green = rating / currentMin * 100;
        blue = rating / currentMin * 100;
    } else if (rating > 0) {
        red = rating / currentMax * 100;
        blue = rating / currentMax * 100;
    } else {
        red = 50;
        green = 50;
        blue = 50;
    }
    return hexFromRGBPercent(red, green, blue);
}

var rating = 0;

function rateGame(ratingTmp) {
    rating = ratingTmp;
    $('#loadingModal').modal({keyboard: false});
}

$('#loadingModal').on('shown.bs.modal', function (e) {
    var newRating = node.value + rating;
    $("#currentRating").text(newRating);
    if (newRating < currentMin) {
        currentMin = newRating;
    }
    if (newRating > currentMax) {
        currentMax = newRating;
    }
    var newColor = {background: 'black', border: 'blue'}; // in order to mark them as done
    nodes.update([{id: node.id, value: newRating, color: newColor, rated: true}]);

    for (var e in currentEdges) {
        var edge = edges.get(currentEdges[e]);
        var otherNode;
        if (edge.from == node.id) {
            otherNode = nodes.get(edge.to);
        } else {
            otherNode = nodes.get(edge.from);
        }

        var otherRating = otherNode.value + rating;
//            console.log("rating: " + rating + ", old val:" + otherNode.value + ", new val:" + newRating);
        if (otherRating < currentMin) {
            currentMin = otherRating;
        }
        if (otherRating > currentMax) {
            currentMax = otherRating;
        }

        if (otherNode.rated) {
            nodes.update([{id: otherNode.id, value: otherRating}]);
        } else {
            var newColor = {background: ratingToHex(otherRating), border: 'black'};
            nodes.update([{id: otherNode.id, value: otherRating, color: newColor}]);
        }

    }
//        console.log("---");
    $('#loadingModal').modal('hide');
});


var container = document.getElementById('mynetwork');
var options = {
    nodes: {
        shape: 'dot'
    },
    physics: false,
    interaction: {
        hover: true,
        dragNodes: false
    }
};

function initNetwork() {
    var data = {
        nodes: nodes,
        edges: edges
    };
    network = new vis.Network(container, data, options);
    network.on("selectNode", function (params) {
        var selNode = params.nodes[0];
        var selEdges = params.edges;
        currentNode = selNode;
        currentEdges = selEdges;
        node = nodes.get(currentNode);
        loadGameData();
        $("#nodeInfosPreview").hide();
        $("#nodeInfos").show();

//            console.log(selNode);
//            console.log(selEdges);
    });
}

$.getJSON("data/steamNetWithPos.json", function (json) {
    var nodesArray = json.nodes;
    var edgesArray = json.edges;
    for (var i in edgesArray) {
        edgesArray[i]["color"] = {color: '#555555', opacity: 0.3, highlight: '#ff0000'}
    }
    for (var i in nodesArray) {
        nodesArray[i]["color"] = {background: 'white', border: 'black'};
        nodesArray[i]['font'] = {size: 15, background: 'white', strokeWidth: 3};
        nodesArray[i]['rated'] = false;
    }
//        console.log(nodesArray[0]);
//        console.log(edgesArray[0]);
    nodes = new vis.DataSet(nodesArray);
    edges = new vis.DataSet(edgesArray);
    initNetwork();

});

