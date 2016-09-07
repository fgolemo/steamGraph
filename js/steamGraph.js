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

$('#loadingModal').modal();

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
            } else {
                if (a.rating > b.rating) {
                    return -1;
                } else if (a.rating < b.rating) {
                    return 1;
                } else {
                    return 0;
                }
            }
        },
        filter: function (item) {
            return (item.rated === false);
        }

    });
    topNodes = topNodes.slice(0, 10);
    $('#top10 > tbody').empty();

    for (var i in topNodes) {
        $('#top10 > tbody:last-child').append(
            '<tr><td>' + topNodes[i].label + '</td><td>' + topNodes[i].value + '</td><td>' + topNodes[i].rating + '/10</td></tr>'
        );
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
    $('#updatingModal').modal({keyboard: false});
}

function showTutorial() {
    $('#tutorial').modal();
}

function updateNodes(nodesClone, id, newStuff) {
    var nodesClean = nodesClone.filter(function (el) {
        return el.id !== id;
    });

    var element = nodesClone.filter(function (el) {
        return el.id === id;
    })[0];

    var newElement = $.extend(true, element, newStuff);

    nodesClean.push(newElement);

    return nodesClean;
}

$('#updatingModal').on('shown.bs.modal', function (e) {
    var nodesClone = nodes.get();
    var scale = network.getScale();
    var viewPos = network.getViewPosition();

    var newRating = node.value + rating;
    $("#currentRating").text(newRating);
    if (newRating < currentMin) {
        currentMin = newRating;
    }
    if (newRating > currentMax) {
        currentMax = newRating;
    }
    var newColor = {background: 'black', border: 'blue'}; // in order to mark them as done

    // I'm using the following function instead of nodes.update, because if I do nodes.update(), it redraws the net
    // and I don't want that right away. I only wanna redraw after I updated all the related nodes
    nodesClone = updateNodes(nodesClone, node.id, {value: newRating, color: newColor, rated: true});
    // nodes.update([{id: node.id, value: newRating, color: newColor, rated: true}]);

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
            nodesClone = updateNodes(nodesClone, otherNode.id, {value: otherRating});
            // nodes.update([{id: otherNode.id, value: otherRating}]);
        } else {
            var newColor = {background: ratingToHex(otherRating), border: 'black'};
            nodesClone = updateNodes(nodesClone, otherNode.id, {value: otherRating, color: newColor});
            // nodes.update([{id: otherNode.id, value: otherRating, color: newColor}]);
        }

    }
    nodes = new vis.DataSet(nodesClone);
    network.setData({nodes: nodes, edges: edges});
    network.moveTo({
        position: viewPos,
        scale: scale,
        animation: false
    }); // because the network zooms out on data update
    $('#updatingModal').modal('hide');
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
    network.on('afterDrawing', function() {
        $('#loadingModal').modal('hide');
    });
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

