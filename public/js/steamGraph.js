var DIR = '../img/refresh-cl/';
var EDGE_LENGTH_MAIN = 150;
var EDGE_LENGTH_SUB = 50;

var currentNode = -1;
var currentEdges = [];
var node;

var currentMax = 0;
var currentMin = 0;

var gameTitles = [];
var wishlist = [];
var selectedGraph = ""; // can be "1K" or "3K"

var storage = window['localStorage'];

$("#nodeInfos").hide();

$('#loadingModal').modal();

function getImgString(sid) {
    return "http://cdn.akamai.steamstatic.com/steam/apps/"+sid+"/capsule_184x69.jpg";
}

function loadGameData() {
    $("#nodeInfos h3 a").text(node.label);
    $("#nodeInfos h3 a").attr('href', node.link);
    $("#steamrating").text(node.rating - 5);
    $("#nodeInfos img").attr("src", getImgString(node.id));
    //$("#nodeInfos img").attr("src", "data/img/" + node.id + ".jpg");
    $("#currentRating").text(node.value);
    if (node.rated) {
        $("#isRated").show();
    } else {
        $("#isRated").hide();
    }
    $('#tags').empty();
    var tags = makeGameTags(node.tags.slice(0, 3));
    $('#tags:last-child').append(tags);
}

function saveGraph() {
    $("#progress").text("compressing " + selectedGraph + " graph ...");
    var graphString = JSON.stringify(nodes.get());
    var cGraphString = LZString.compressToUTF16(graphString);
    $("#progress").text("saving " + selectedGraph + " graph ...");


    storage.setItem(selectedGraph + 'nodes', cGraphString);
    $("#progress").text("saved " + selectedGraph + " graph. " + moment().calendar());
}

function loadGraph() {
    $("#progress").text("decompressing " + selectedGraph + " graph ...");
    var cGraphString = storage.getItem(selectedGraph + 'nodes');
    var graphString = LZString.decompressFromUTF16(cGraphString);
    var nodesTmp = JSON.parse(graphString);

    $("#progress").text("loading " + selectedGraph + " graph ...");
    nodes = new vis.DataSet(nodesTmp);
    network.setData({nodes: nodes, edges: edges});

    $("#progress").text("loaded " + selectedGraph + " graph. " + moment().calendar());

    // var data = JSON.stringify(nodes.get());
    // var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
    // window.open(url, '_blank');
    // window.focus();

}

function gettop10() {
    top10closePops();
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
            return (item.rated === false && item.top10 === true);
        }

    });
    topNodes = topNodes.slice(0, 10);
    $('.clickable-row').off('click');
    $('#top10 > tbody').empty();


    for (var i in topNodes) {
        $('#top10 > tbody:last-child').append(
            '<tr class="clickable-row" data-sid="' + topNodes[i].id + '"><td>' + topNodes[i].label + '</td><td>' + topNodes[i].value + '</td><td>' + (topNodes[i].rating - 5) + '/5</td></tr>'
        );
    }
    $(".clickable-row").click(function () {
        top10closePops();
        var sid = $(this).data("sid");
        $(this).addClass("has-popover");
        $(this).popover({
            container: 'body',
            html: true,
            placement: 'auto',
            content: '<button class="btn btn-sm btn-primary btn-block" onclick="top10open(' + sid + ')">open in graph</button> ' +
            '<button class="btn btn-sm btn-success btn-block" onclick="top10wishlist(' + sid + ')">move to wishlist</button> ' +
            '<button class="btn btn-sm btn-danger btn-block" onclick="top10remove(' + sid + ')">remove from top10</button> ' +
            '<button class="btn btn-sm btn-default btn-block" onclick="top10cancel(' + sid + ')">&times;</button>'
        }).popover('show');
    });
}

function top10closePops() {
    $(".has-popover").popover('destroy');
}

function top10open(sid) {
    top10cancel(sid);
    moveToElement(sid, null);
}

function top10wishlist(sid) {
    var game = nodes.get(sid);
    wishlist.push(game);
    top10remove(sid);
}

function top10remove(sid) {
    nodes.update({id: sid, top10: false});
    top10cancel(sid);
    gettop10();
}

function top10cancel(sid) {
    var item = $('tr[data-sid="' + sid + '"]');
    item.removeClass("has-popover");
    item.popover('destroy');
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
    $("#isRated").show();
    $('#updatingModal').modal({backdrop: 'static', keyboard: false});
}

function showTutorial() {
    $('#tutorial').modal();
}

function showCredits() {
    $('#credits').modal();
}

function showWishlist() {
    if (wishlist.length > 0) {
        $("#empty-wishlist").hide();
        $('#wishlist ul.media-list').empty();
        for (var i in wishlist) {
            var game = wishlist[i];
            var tags = makeGameTags(game.tags.slice(0, 4));
            $('#wishlist ul.media-list:last-child').append(
                '<li class="media">' +
                '<div class="media-left">' +
                '<a href="' + game.link + '" target="_blank">' +
                '<img class="media-object" src="'+getImgString(game.id)+'">' +
                '</a>' +
                '</div>' +
                '<div class="media-body">' +
                '<a href="' + game.link + '" target="_blank">' +
                '<h4 class="media-heading">' + game.label + '</h4>' +
                '</a>' +
                '<span class="wishlist-value">Graph rating: <strong>' + game.value + '</strong></span>&nbsp;&nbsp;&nbsp;' +
                '<span class="wishlist-rating">Steam rating: ' + (game.rating - 5) + '/5</span><br>' +
                'Tags: ' + tags +
                '</div>' +
                '</li>'
            );
        }
    } else {

    }


    $('#wishlist').modal();
}

function updateOnWishlist(sid, newValue) {
    console.log(wishlist);
    for (var i in wishlist) {

        if (wishlist[i].id == sid) {
            wishlist[i].value = newValue;
        }
    }
}

function makeGameTags(tags) {
    var output = "";
    for (var t in tags) {

        output += '<span class="label label-default">' + tags[t] + '</span>&nbsp;';
    }
    return output;
}

function moveToElement(id, label) {
    var selectedNodes;
    if (label) { //
        selectedNodes = nodes.get({
            filter: function (item) {
                return (item.label == label);
            }
        });
    } else {
        selectedNodes = nodes.get({
            filter: function (item) {
                return (item.id == id); //TODO: we can do this simpler
            }
        });
    }
    var scale = network.getScale();
    if (scale < 0.5) {
        scale = 0.5;
    }
    network.setSelection({
        nodes: [selectedNodes[0].id]
    }, {
        unselectAll: true,
        highlightEdges: true
    });
    network.moveTo({
        position: {x: selectedNodes[0].x, y: selectedNodes[0].y},
        scale: scale,
        animation: {
            duration: 300
        }
    });
    var selEdges = network.getSelectedEdges();
    //console.log(selEdges);
    selectNode(selectedNodes[0].id, selEdges);
}

function getGameList(nodesArray) {
    gameTitles = [];
    for (var i in nodesArray) {
        gameTitles.push(nodesArray[i].label);
    }
    var input = document.getElementById("search");
    new Awesomplete(input, {
        list: gameTitles
    });
    Awesomplete.$.bind(input, {
        "awesomplete-selectcomplete": function (evt) {
            console.log(evt.text);
            moveToElement(null, evt.text.value);
        }
    });
}

$('#updatingModal').on('shown.bs.modal', function (e) {
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

    var updates = [];

    // I'm using the following function instead of nodes.update, because if I do nodes.update(), it redraws the net
    // and I don't want that right away. I only wanna redraw after I updated all the related nodes
    updates.push({id: node.id, value: newRating, color: newColor, rated: true});

    updateOnWishlist(node.id, newRating);

    for (var e in currentEdges) {
        var edge = edges.get(currentEdges[e]);
        var otherNode;
        if (edge.from == node.id) {
            otherNode = nodes.get(edge.to);
        } else {
            otherNode = nodes.get(edge.from);
        }

        var otherRating = otherNode.value + rating;
        if (otherRating < currentMin) {
            currentMin = otherRating;
        }
        if (otherRating > currentMax) {
            currentMax = otherRating;
        }

        if (otherNode.rated) {
            updates.push({id: otherNode.id, value: otherRating});
        } else {
            var newColor = {background: ratingToHex(otherRating), border: 'black'};
            updates.push({id: otherNode.id, value: otherRating, color: newColor});
        }
        updateOnWishlist(otherNode.id, otherRating);

    }
    nodes.update(updates);
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

function selectNode(selNode, selEdges) {
    currentNode = selNode;
    currentEdges = selEdges;
    node = nodes.get(currentNode);
    loadGameData();
    $("#nodeInfosPreview").hide();
    $("#nodeInfos").show();
}

function initNetwork() {
    var data = {
        nodes: nodes,
        edges: edges
    };
    network = new vis.Network(container, data, options);
    network.on('afterDrawing', function () {
        $('#loadingModal').modal('hide');
    });
    network.on("selectNode", function (params) {
        selectNode(params.nodes[0], params.edges);
    });
}

$('#graphSelect').modal({backdrop: 'static', keyboard: false});

function selectGraph(nk) {
    $('#graphSelect').modal('hide');
    selectedGraph = nk;
    $.getJSON("data/steamNetWithPos" + selectedGraph + ".json", function (json) {
        var nodesArray = json.nodes;
        var edgesArray = json.edges;
        console.log("nodes: " + nodesArray.length);
        for (var i in edgesArray) {
            edgesArray[i]["color"] = {color: '#555555', opacity: 0.3, highlight: '#ff0000'}
        }
        for (var i in nodesArray) {
            nodesArray[i]["color"] = {background: 'white', border: 'black'};
            nodesArray[i]['font'] = {size: 15, background: 'white', strokeWidth: 3};
            nodesArray[i]['rated'] = false;
            nodesArray[i]['top10'] = true;
        }
        nodes = new vis.DataSet(nodesArray);
        edges = new vis.DataSet(edgesArray);
        initNetwork();
        getGameList(nodesArray);
    });
}

