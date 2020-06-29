(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.Neo4jd3 = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {exports: {}};
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (_dereq_, module, exports) {
            'use strict';

            var neo4jd3 = _dereq_('./scripts/neo4jd3');

            module.exports = neo4jd3;

        }, {"./scripts/neo4jd3": 2}], 2: [function (_dereq_, module, exports) {
            /* global d3, document */
            /* jshint latedef:nofunc */
            'use strict';

            function Neo4jD3(_selector, _options) {
                var container, graph, info, node, nodes, relationship, relationshipOutline, relationshipOverlay,
                    relationshipText, relationships, selector, simulation, svg, svgNodes, svgRelationships, svgScale,
                    svgTranslate,
                    classes2colors = {},
                    justLoaded = false,
                    numClasses = 0,
                    options = {
                        arrowSize: 4,
                        colors: colors(),
                        highlight: undefined,
                        minCollision: undefined,
                        neo4jData: undefined,
                        neo4jDataUrl: undefined,
                        nodeOutlineFillColor: undefined,
                        nodeOutlineStroke: undefined,
                        nodeFillByType: undefined,
                        nodeRadius: 25,
                        relationshipColor: undefined,
                        zoomFit: false,
                        titled: false,
                        eachNodeHasItsOwnColor: false
                    },
                    builtRelations = {},
                    relationCount = {},
                    VERSION = '0.0.1';

                function appendGraph(container) {
                    svg = container.append('svg')
                        .attr('width', '100%')
                        .attr('height', '100%')
                        .attr('class', 'neo4jd3-graph')
                        .call(d3.zoom().on('zoom', function () {
                        var scale = d3.event.transform.k,
                            translate = [d3.event.transform.x, d3.event.transform.y];

                        if (svgTranslate) {
                            translate[0] += svgTranslate[0];
                            translate[1] += svgTranslate[1];
                        }

                        if (svgScale) {
                            scale *= svgScale;
                        }

                        svg.attr('transform', 'translate(' + translate[0] + ', ' + translate[1] + ') scale(' + scale + ')');
                    }))
                    // .on('dblclick.zoom', null)
                        .append('g')
                        .attr('width', '100%')
                        .attr('height', '100%');

                    svgRelationships = svg.append('g')
                        .attr('class', 'relationships');

                    svgNodes = svg.append('g')
                        .attr('class', 'nodes');

                    svg.append("svg:defs").append("svg:marker")
                        .attr("id", "triangle")
                        .attr("refX", 2)
                        .attr("refY", 2)
                        .attr("markerWidth", 30)
                        .attr("markerHeight", 30)
                        .attr("markerUnits", "userSpaceOnUse")
                        .attr("orient", "auto")
                        .append("path")
                        .attr("d", "M 0 0 4 2 0 4 1 2")
                        .style("fill", "#a5abb6");
                }


                function appendNode() {
                    return node.enter()
                        .append('g')
                        .attr('class', function(d) {
                        var highlight, i,
                            classes = 'node',
                            label = d.labels[0];

                        if (options.highlight) {
                            for (i = 0; i < options.highlight.length; i++) {
                                highlight = options.highlight[i];

                                if (d.labels[0] === highlight.class && d.properties[highlight.property] === highlight.value) {
                                    classes += ' node-highlighted';
                                    break;
                                }
                            }
                        }

                        return classes;
                    })

                        .on("click", function(d) { // Toma Url del nodo
                        //                        window.open(d.properties.url); 
                        click(d)
                    })  
                    /*   .on('dblclick', function(d) {
                        stickNode(d);

                        if (typeof options.onNodeDoubleClick === 'function') {
                            options.onNodeDoubleClick(d);
                        }
                    })*/
                        .on('mouseenter', function(d) {
                        if (info) {
                            updateInfo(d);
                        }

                        if (typeof options.onNodeMouseEnter === 'function') {
                            options.onNodeMouseEnter(d);
                        }
                    })
                        .on('mouseleave', function(d) {
                        if (info) {
                            clearInfo(d);
                        }

                        if (typeof options.onNodeMouseLeave === 'function') {
                            options.onNodeMouseLeave(d);
                        }
                    })
                        .call(d3.drag()
                              .on('start', dragStarted)
                              .on('drag', dragged)
                              .on('end', dragEnded));
                }

                function appendNodeToGraph() {
                    var n = appendNode();


                    appendRingToNode(n);
                    appendOutlineToNode(n);

                    appendTextToNode(n);
                    appendTextToNode2(n);
                    appendTitleToNode(n);

                    return n;
                }

                function appendOutlineToNode(node) {
                    return node.append('circle')
                        .attr('class', 'outline contenido')
                        .attr('r', function (d){
                        if (d.properties.estilo == 'solido'){
                            return options.nodeRadius * 1.16 
                        }else{
                            return options.nodeRadius
                        }
                    })
                    //Rellenar el nodo por color según estilo
                        .style ("fill", function(d){
                        if (d.properties.estilo == 'solido'){
                            return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
                        }
                    })
                        .style("stroke-dasharray", ("8,2"))
                        .style('stroke', function(d) {
                        // Línea de nodo según clase
                        if (options.eachNodeHasItsOwnColor)
                            return d.color;
                        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
                    })
                        .style("stroke-width", function(d) {
                        if (d.properties.estilo =='solido'){
                            return "0"
                        }
                    })
                        .attr("fill-opacity", "0.4")
                }

                function click(d) { 
                    //node.attr("xlink:href",function(d){return d.url;})
                    node.attr("data-toggle", "modal")
                    node.attr("xlink:href","#myModal")
                    datum(d)

                    /*$('#myModal').on('show.bs.modal', function(d) {

                        let modalTitle = d3.selectAll("h4.modal-title");
                        modalTitle.text(d.properties.name);
                        let modalBody = d3.selectAll(".modal-body");
                        modalBody.html("Propósitos: " + d.properties.objetivo1 + "<br>" + d.properties.objetivo2);
                    })*/

                }



                function appendRingToNode(node) {
                    return node.append('circle')
                        .attr('class', 'ring')
                        .attr('r', function (d){
                        if (d.properties.estilo == 'solido'){
                            return options.nodeRadius * 1.32 
                        }else{
                            return options.nodeRadius * 1.16
                        }
                    })
                        .style("stroke", function(d) {
                        if (options.eachNodeHasItsOwnColor)
                            return d.color;
                        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
                    })

                }
                function appendTitleToNode(node) {
                    return node.append('text')
                        .attr('class', function(d) {
                        return 'text';
                    })
                        .style('fill', function(d) {
                        if (options.eachNodeHasItsOwnColor)
                            return d.color;
                        return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);
                    })
                        .style ('font-size', '8px')
                        .style ('font-weight', '800')
                        .attr("font-family","Roboto")

                        .style ('text-transform', 'uppercase')
                        .attr('text-anchor', 'middle') //alineación horizontal
                        .attr('y', '4px') // posición en Y

                        .html(function(d){
                        return d.properties.name;
                    });
                }

                function appendTextToNode(node) {
                    return node.append('text')
                        .attr('class', function(d) {
                        return 'text';
                    })
                        .attr('fill', '#282828')
                        .style ('font-size', '6px')
                        .attr('pointer-events', 'none')
                        .attr('text-anchor', function(d){
                        if (d.properties.tipo=="intersección"){
                            return "middle"
                        }else{
                            return'left'
                        }       
                    })
                        .attr("font-family","Roboto")
                        .attr('y', function(d){
                        if (d.properties.tipo=="intersección" && d.properties.objetivo2 !=""){
                            return "3px"
                        }
                        if (d.properties.objetivo2=="" && d.properties.tipo=="intersección"){
                            return "0px"
                        }
                        if (d.properties.tramo=="comun" || d.properties.tramo=="electivo"){
                            return "-7px"
                        }
                    })
                        .html(function(d) {
                        return d.properties.objetivo1
                    });
                }

                function appendTextToNode2(node) {
                    return node.append('text')
                        .attr('class', function(d) {
                        return 'text';
                    })
                        .attr('fill', '#282828')
                        .style ('font-size', '6px')
                        .attr('pointer-events', 'none')
                        .attr('text-anchor', function(d){
                        if (d.properties.tipo=="intersección"){
                            return "middle"
                        }else{
                            return'left'
                        }       
                    })
                        .attr("font-family","Roboto")
                        .attr('y', function(d){
                        if (d.properties.tipo=="intersección"){
                            return "-3px"
                        }else{
                            return '-14px'
                        }       
                    })
                        .html(function(d) {
                        return d.properties.objetivo2
                    });
                }

                /*
                d3.selectAll(".checkbox").each(function(d){
                        cb = d3.select(this);
                        grp = cb.property("value")
                        if(cb.property("checked")){
                                .transition()
                                .duration(1000)
                                .style("fill", function(d){
                                if (options.eachNodeHasItsOwnColor)
                                    return d.color;
                                return options.nodeOutlineFillColor ? options.nodeOutlineFillColor : class2color(d.labels[0]);})
                                .style("opacity",0.2)
                        }else{ svg.selectAll("."+grp).transition().duration(1000).style("opacity", 0)
                             }
                    })*/


                function appendRelationship() {
                    return relationship.enter()
                        .append('g')
                        .attr('class', 'relationship')
                        .on('dblclick', function(d) {
                        if (typeof options.onRelationshipDoubleClick === 'function') {
                            options.onRelationshipDoubleClick(d);
                        }
                    })
                        .on('mouseenter', function(d) {
                        if (info) {
                            updateInfo(d);
                        }
                    });
                }

                function appendOutlineToRelationship(r) {
                    return r.append('path')
                        .attr('class', function (d){
                        if (d.type=="vinculo"){
                            return "outline link"
                        }
                    })
                        .style('stroke', function(d){
                        if(d.startNode=="1" || d.startNode=="2"){
                            return options.colors[0]
                        }
                        if(d.startNode=="3" || d.startNode=="4"){
                            return options.colors[1]
                        }
                        if(d.startNode=="5" || d.startNode=="6"){
                            return options.colors[2]
                        }
                        if(d.startNode=="7" || d.startNode=="8"){
                            return options.colors[3]
                        }
                        if(d.startNode=="9" || d.startNode=="10" || d.startNode=="11"){
                            return options.colors[4]
                        }
                        if(d.startNode>"11" && d.startNode<"15"){
                            return options.colors[5]
                        }
                        if(d.startNode >"22" && d.startNode<"29"){
                            return options.colors[7]
                        }
                        if(d.startNode >"28" && d.startNode<"34"){
                            return options.colors[8]
                        }
                        if(d.startNode >"33" && d.startNode<"39"){
                            return options.colors[9]
                        }
                        if(d.startNode >"38" && d.startNode<"44"){
                            return options.colors[10]
                        }
                        if(d.startNode >"43" && d.startNode<"48"){
                            return options.colors[11]
                        }
                        if(d.startNode >"47" && d.startNode<"51"){
                            return options.colors[12]
                        }
                        if(d.startNode >"50" && d.startNode<"54"){
                            return options.colors[13]
                        }

                    })
                }
                function appendOverlayToRelationship(r) {
                    return r.append('path')
                        .attr('class', 'overlay');
                }

                function appendTextToRelationship(r) {
                    return r.append('text')
                    //              .attr("width", "500")
                        .attr('class', 'text')
                    //            .append('textPath')
                    //            .attr("xlink:href","outline link")
                    //  .style("background-color", "steelblue") 
                        .attr('fill', '#000000')
                        .attr('font-size', '4px')
                        .attr('pointer-events', 'none')
                        .attr('text-anchor', 'middle')

                        .text(function (d) {
                        let text = d.properties.objetivo1;
                        //builtRelations[`${d.startNode},${d.endNode},${d.type},`] ? '  '.repeat(d.type.length): d.type;
                        builtRelations[`${d.endNode},${d.startNode},${d.type},`] = true;

                        return d.properties.objetivo1;
                    });
                }

                function appendRelationshipToGraph() {
                    var relationship = appendRelationship(),
                        text = appendTextToRelationship(relationship),
                        outline = appendOutlineToRelationship(relationship),
                        overlay = appendOverlayToRelationship(relationship);

                    return {
                        outline: outline,
                        overlay: overlay,
                        relationship: relationship,
                        text: text
                    };
                }

                function class2color(cls) {
                    var color = classes2colors[cls];

                    if (!color) {
                        color = options.colors[numClasses % options.colors.length];
                        classes2colors[cls] = color;
                        numClasses++;
                    }

                    return color;
                }

                function class2darkenColor(cls) {
                    return d3.rgb(class2color(cls)).darker(1);
                }


                function clearInfo() {
                    info.html('');
                }


                function colors() {
                    // d3.schemeCategory10,
                    // d3.schemeCategory20,
                    return [
                        '#00acec', // turquesa /Cuatrimestre 1
                        '#8ec4a0', // verde olivo / Cuatrimestre 2
                        '#d7de3f', // amarillo verdoso / Cuatrimestre 3
                        '#f2c830', // amarillo anaranjado / Cuatrimestre 4
                        '#FC7A1E', // naranja oscuro / Cuatrimestre 5
                        '#e2465e', // rojo oscuro /Cuatrimestre 6
                        '#b8bec4', // gris claro /Comunes
                        '#4353a0', // azul /Narrativas Interactivas
                        '#E980FC', // lila /Dispositivos e interfaces
                        '#06D6A0', // verde menta / Producción Audiovisual
                        '#7067CF', // violeta azulado / Algoritmos y datos
                        '#099f03', // verde para no poner ese marrón feo / Arte y Tecnociencia
                        '#9A48D0', // violeta /Arte Contemporáneo
                        '#b7214f', // rojo-rosa /Materialidad Expandida
                        '#8fc6d4', // celeste /Trabajo final
                        '#ce599c', // rosa viejo / Trayectos Formativos
                        '#98A6D4' // lila medio gris / Electivas
                    ];
                }

                function contains(array, id) {
                    var filter = array.filter(function(elem) {
                        return elem.id === id;
                    });

                    return filter.length > 0;
                }

                function defaultColor() {
                    return options.relationshipColor ? options.relationshipColor : class2color(d.labels[0]);
                }

                function defaultDarkenColor() {
                    return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
                }

                function dragEnded(d) {
                    if (!d3.event.active) {
                        simulation.alphaTarget(0);
                    }

                    if (typeof options.onNodeDragEnd === 'function') {
                        options.onNodeDragEnd(d);
                    }
                }

                function dragged(d) {
                    stickNode(d);
                }

                function dragStarted(d) {
                    if (!d3.event.active) {
                        simulation.alphaTarget(0.3).restart();
                    }

                    d.fx = d.x;
                    d.fy = d.y;

                    if (typeof options.onNodeDragStart === 'function') {
                        options.onNodeDragStart(d);
                    }
                }

                function extend(obj1, obj2) {
                    var obj = {};

                    merge(obj, obj1);
                    merge(obj, obj2);

                    return obj;
                }



                function init(_selector, _options) {

                    merge(options, _options);

                    if (options.icons) {
                        options.showIcons = true;
                    }

                    if (!options.minCollision) {
                        options.minCollision = options.nodeRadius;
                    }


                    selector = _selector;

                    container = d3.select(selector);

                    container.attr('class', 'neo4jd3')
                        .html('');

                    if (options.infoPanel) {
                        info = appendInfoPanel(container);
                    }

                    appendGraph(container);

                    simulation = initSimulation();

                    if (options.neo4jData) {
                        loadNeo4jData(options.neo4jData);
                    } else if (options.neo4jDataUrl) {
                        loadNeo4jDataFromUrl(options.neo4jDataUrl);
                    } else {
                        console.error('Error: both neo4jData and neo4jDataUrl are empty!');
                    }
                }

                // D3 FORCE
                function initSimulation() {
                    var simulation = d3.forceSimulation()
                    //                           .velocityDecay(0.8)
                    //                           .force('x', d3.force().strength(0.002))
                    //                           .force('y', d3.force().strength(0.002))
                    .force('collide', d3.forceCollide().radius(function(d) {
                        return options.minCollision
                        /*if(d.type=="interseccion"){
                             options.nodeRadius/2;
                        }
                        if(d.type=="grupo"){
                         options.nodeRadius * 3;
                        }*/
                    }).iterations(2))
                    .force('charge', d3.forceManyBody())
                    .force('link', d3.forceLink().id(function(d) {
                        return d.id;

                    })
                           .distance(function(d){
                        if(d.type=="grupo"){
                            return 150
                        }else{
                            return -10
                        }
                    })
                           .strength(1))
                    .force('center', d3.forceCenter(svg.node().parentElement.parentElement.clientWidth / 2, svg.node().parentElement.parentElement.clientHeight / 2))
                    .on('tick', function() {
                        tick();
                    })
                    .on('end', function() {
                        if (options.zoomFit && !justLoaded) {
                            justLoaded = true;
                            zoomFit(2);
                        }
                    });

                    return simulation;
                }

                function loadNeo4jData() {
                    nodes = [];
                    relationships = [];

                    updateWithNeo4jData(options.neo4jData);
                }

                function loadNeo4jDataFromUrl(neo4jDataUrl) {
                    nodes = [];
                    relationships = [];

                    d3.json(neo4jDataUrl, function(error, data) {
                        if (error) {
                            throw error;
                        }

                        updateWithNeo4jData(data);
                    });
                }

                function merge(target, source) {
                    Object.keys(source).forEach(function(property) {
                        target[property] = source[property];
                    });
                }

                function neo4jDataToD3Data(data) {
                    var graph = {
                        nodes: [],
                        relationships: []
                    };

                    data.results.forEach(function(result) {
                        result.data.forEach(function(data) {
                            data.graph.nodes.forEach(function(node) {
                                if (!contains(graph.nodes, node.id)) {
                                    graph.nodes.push(node);
                                }
                            });

                            data.graph.relationships.forEach(function(relationship) {
                                relationship.source = relationship.startNode;
                                relationship.target = relationship.endNode;
                                graph.relationships.push(relationship);
                            });

                            data.graph.relationships.sort(function(a, b) {
                                if (a.source > b.source) {
                                    return 1;
                                } else if (a.source < b.source) {
                                    return -1;
                                } else {
                                    if (a.target > b.target) {
                                        return 1;
                                    }

                                    if (a.target < b.target) {
                                        return -1;
                                    } else {
                                        return 0;
                                    }
                                }

                            });

                            for (var i = 0; i < data.graph.relationships.length; i++) {
                                if (i !== 0 && data.graph.relationships[i].source === data.graph.relationships[i-1].source && data.graph.relationships[i].target === data.graph.relationships[i-1].target) {
                                    data.graph.relationships[i].linknum = data.graph.relationships[i - 1].linknum + 1;
                                } else {
                                    data.graph.relationships[i].linknum = 1;
                                }
                            }
                        });
                    });

                    return graph;
                }


                function rotate(cx, cy, x, y, angle) {
                    var radians = (Math.PI / 180) * angle,
                        cos = Math.cos(radians),
                        sin = Math.sin(radians),
                        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
                        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

                    return { x: nx, y: ny };
                }

                function rotatePoint(c, p, angle) {
                    return rotate(c.x, c.y, p.x, p.y, angle);
                }

                function rotation(source, target) {
                    return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
                }

                function size() {
                    return {
                        nodes: nodes.length,
                        relationships: relationships.length
                    };
                }
                /*
    function smoothTransform(elem, translate, scale) {
        var animationMilliseconds = 5000,
            timeoutMilliseconds = 50,
            steps = parseInt(animationMilliseconds / timeoutMilliseconds);

        setTimeout(function() {
            smoothTransformStep(elem, translate, scale, timeoutMilliseconds, 1, steps);
        }, timeoutMilliseconds);
    }

    function smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step, steps) {
        var progress = step / steps;

        elem.attr('transform', 'translate(' + (translate[0] * progress) + ', ' + (translate[1] * progress) + ') scale(' + (scale * progress) + ')');

        if (step < steps) {
            setTimeout(function() {
                smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step + 1, steps);
            }, timeoutMilliseconds);
        }
    }
*/
                function stickNode(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function tick() {
                    tickNodes();
                    tickRelationships();
                }

                function tickNodes() {
                    if (node) {
                        node.attr('transform', function(d) {
                            return 'translate(' + d.x + ', ' + d.y + ')';
                        });
                    }
                }

                function tickRelationships() {
                    if (relationship) {
                        relationship.attr('transform', function (d) {

                            if (!d.linkn) {
                                var key = d.source.id + '@@' + d.target.id;
                                if (!relationCount[key])
                                    relationCount[key] = 1;
                                d.linkn = relationCount[key]++;
                            }

                            var center = {x: 0, y: 0},
                                angle = rotation(d.source, d.target),
                                u = unitaryVector(d.source, d.target),
                                n = unitaryNormalVector(d.source, d.target),
                                g = rotatePoint(center, u, -10 * d.linkn),
                                source = rotatePoint(center, {
                                    x: 0 + (options.nodeRadius + 1) * u.x - n.x,
                                    y: 0 + (options.nodeRadius + 1) * u.y - n.y
                                }, angle + 10 * d.linkn),
                                target = rotatePoint(center, {
                                    x: d.target.x - d.source.x - (options.nodeRadius + 2) * g.x,
                                    y: d.target.y - d.source.y - (options.nodeRadius + 2) * g.y
                                }, angle),
                                uu = unitaryNormalVector(source, target),
                                middle = {
                                    x: (source.x + target.x) / 2 + uu.x * 20 * d.linkn,
                                    y: (source.y + target.y) / 2 + uu.y * 20 * d.linkn
                                };
                            d.outline = {middle: middle, source: source, target: target, u: uu}

                            return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
                        });

                        tickRelationshipsTexts();
                        tickRelationshipsOutlines();
                        tickRelationshipsOverlays();
                    }
                }

                function tickRelationshipsOutlines() {
                    relationship.each(function(relationship) {
                        var rel = d3.select(this),
                            // outline = rel.select('.outline'),
                            // text = rel.select('.text'),
                            //  bbox = text.node().getBBox(),
                            // padding = 3;

                            //outline.attr('d', function(d) {
                            //   var center = { x: 0, y: 0 },
                            //     angle = rotation(d.source, d.target),
                            //     textBoundingBox = text.node().getBBox(),
                            //    textPadding = 5,
                            //   u = unitaryVector(d.source, d.target),
                            //    textMargin = { x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5, y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5 },
                            //    n = unitaryNormalVector(d.source, d.target),
                            //    rotatedPointA1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x - n.x, y: 0 + (options.nodeRadius + 1) * u.y - n.y }, angle),
                            //   rotatedPointB1 = rotatePoint(center, { x: textMargin.x - n.x, y: textMargin.y - n.y }, angle),
                            //    rotatedPointC1 = rotatePoint(center, { x: textMargin.x, y: textMargin.y }, angle),
                            //   rotatedPointD1 = rotatePoint(center, { x: 0 + (options.nodeRadius + 1) * u.x, y: 0 + (options.nodeRadius + 1) * u.y }, angle),
                            //  rotatedPointA2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x - n.x, y: d.target.y - d.source.y - textMargin.y - n.y }, angle),
                            //  rotatedPointB2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y - u.y * options.arrowSize }, angle),
                            //  rotatedPointC2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - n.x + (n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - n.y + (n.y - u.y) * options.arrowSize }, angle),
                            //   rotatedPointD2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y }, angle),
                            //  rotatedPointE2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x + (- n.x - u.x) * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y + (- n.y - u.y) * options.arrowSize }, angle),
                            //  rotatedPointF2 = rotatePoint(center, { x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize, y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize }, angle),
                            // rotatedPointG2 = rotatePoint(center, { x: d.target.x - d.source.x - textMargin.x, y: d.target.y - d.source.y - textMargin.y }, angle);

                            // return 'M ' + rotatedPointA1.x + ' ' + rotatedPointA1.y +
                            //       ' L ' + rotatedPointB1.x + ' ' + rotatedPointB1.y +
                            //       ' L ' + rotatedPointC1.x + ' ' + rotatedPointC1.y +
                            //      ' L ' + rotatedPointD1.x + ' ' + rotatedPointD1.y +
                            //     ' Z M ' + rotatedPointA2.x + ' ' + rotatedPointA2.y +
                            //    ' L ' + rotatedPointB2.x + ' ' + rotatedPointB2.y +
                            //    ' L ' + rotatedPointC2.x + ' ' + rotatedPointC2.y +
                            //   ' L ' + rotatedPointD2.x + ' ' + rotatedPointD2.y +
                            //  ' L ' + rotatedPointE2.x + ' ' + rotatedPointE2.y +
                            // ' L ' + rotatedPointF2.x + ' ' + rotatedPointF2.y +
                            //  ' L ' + rotatedPointG2.x + ' ' + rotatedPointG2.y +
                            //   ' Z';
                            outline = rel.select('.outline');
                        outline.attr('d', function (d) {

                            var source = d.outline.source,
                                target = d.outline.target,
                                middle = d.outline.middle;

                            return `M ${target.x}, ${target.y} 
Q ${middle.x} ${middle.y} ${source.x} ${source.y} 
Q ${middle.x} ${middle.y} ${target.x}, ${target.y}
`;
                        });
                    });
                }

                // function tickRelationshipsOverlays() {
                // relationshipOverlay.attr('d', function(d) {
                //            var center = { x: 0, y: 0 },
                //                angle = rotation(d.source, d.target),
                //                n1 = unitaryNormalVector(d.source, d.target),
                //                n = unitaryNormalVector(d.source, d.target, 50),
                //                rotatedPointA = rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle),
                //                rotatedPointB = rotatePoint(center, { x: d.target.x - d.source.x - n.x, y: d.target.y - d.source.y - n.y }, angle),
                //                rotatedPointC = rotatePoint(center, { x: d.target.x - d.source.x + n.x - n1.x, y: d.target.y - d.source.y + n.y - n1.y }, angle),
                //                rotatedPointD = rotatePoint(center, { x: 0 + n.x - n1.x, y: 0 + n.y - n1.y }, angle);
                //
                //            return 'M ' + rotatedPointA.x + ' ' + rotatedPointA.y +
                //                   ' L ' + rotatedPointB.x + ' ' + rotatedPointB.y +
                //                   ' L ' + rotatedPointC.x + ' ' + rotatedPointC.y +
                //                   ' L ' + rotatedPointD.x + ' ' + rotatedPointD.y +
                //                   ' Z';
                //        });
                //    }
                function tickRelationshipsOverlays() {
                    relationshipOverlay.attr('d', function (d) {
                        var source = d.outline.source,
                            target = d.outline.target,
                            middle = d.outline.middle,
                            u = d.outline.u;
                        return `M ${source.x}, ${source.y} 
Q ${middle.x + 5 * u.x} ${middle.y + 5 * u.y} ${target.x} ${target.y}
Q  ${middle.x - 5 * u.x} ${middle.y - 5 * u.y}  ${source.x} ${source.y}
Z`;
                    });
                }

                function tickRelationshipsTexts() {
                    relationshipText.attr('transform', function(d) {
                        var angle = (rotation(d.source, d.target) + 360) % 360,
                            //                mirror = angle > 90 && angle < 270,
                            //                center = { x: 0, y: 0 },
                            //                n = unitaryNormalVector(d.source, d.target),
                            //                nWeight = mirror ? 2 : -3,
                            //                point = { x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight, y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight },
                            //                rotatedPoint = rotatePoint(center, point, angle);
                            //
                            //            return 'translate(' + rotatedPoint.x + ', ' + rotatedPoint.y + ') rotate(' + (mirror ? 180 : 0) + ')';
                            //        });
                            //    }
                            mirror = angle > 90 && angle < 270,
                            source = d.outline.source,
                            target = d.outline.target,
                            u = d.outline.u,
                            middle = {
                                x: (source.x + target.x) / 2 + u.x * (mirror ? 8 : 10) * d.linkn + u.x,
                                y: (source.y + target.y) / 2 + u.y * (mirror ? 8 : 10) * d.linkn + u.y
                            };
                        return 'translate(' + middle.x + ', ' + middle.y + ') rotate(' + (mirror ? 180 : 0) + ')';
                    });
                }

                function toString(d) {
                    var s = d.labels ? d.labels[0] : d.type;

                    s += ' (<id>: ' + d.id;

                    Object.keys(d.properties).forEach(function(property) {
                        s += ', ' + property + ': ' + JSON.stringify(d.properties[property]);
                    });

                    s += ')';

                    return s;
                }

                function unitaryNormalVector(source, target, newLength) {
                    var center = { x: 0, y: 0 },
                        vector = unitaryVector(source, target, newLength);

                    return rotatePoint(center, vector, 90);
                }

                function unitaryVector(source, target, newLength) {
                    var length = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) / Math.sqrt(newLength || 1);

                    return {
                        x: (target.x - source.x) / length,
                        y: (target.y - source.y) / length,
                    };
                }
                //ACÁ VINCULA D3 Y NEO4J
                function updateWithD3Data(d3Data) {
                    updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
                }

                function updateWithNeo4jData(neo4jData) {
                    var d3Data = neo4jDataToD3Data(neo4jData);
                    updateWithD3Data(d3Data);
                }

                //INFO QUE SE VE

                function updateInfo(d) {
                    clearInfo();

                    if (d.labels) {
                        appendInfoElementClass('class', d.labels[0]);
                    } else {
                        appendInfoElementRelationship('class', d.type);
                    }

                    appendInfoElementProperty('property', '&lt;id&gt;', d.id);

                    Object.keys(d.properties).forEach(function(property) {
                        appendInfoElementProperty('property', property, JSON.stringify(d.properties[property]));
                    });
                }

                function updateNodes(n) {
                    Array.prototype.push.apply(nodes, n);

                    node = svgNodes.selectAll('.node')
                        .data(nodes, function(d) { return d.id; });
                    var nodeEnter = appendNodeToGraph();
                    node = nodeEnter.merge(node);
                }

                function updateNodesAndRelationships(n, r) {
                    updateRelationships(r);
                    updateNodes(n);

                    simulation.nodes(nodes);
                    simulation.force('link').links(relationships);
                }

                function updateRelationships(r) {
                    Array.prototype.push.apply(relationships, r);

                    relationship = svgRelationships.selectAll('.relationship')
                        .data(relationships, function(d) { return d.id; });

                    var relationshipEnter = appendRelationshipToGraph();

                    relationship = relationshipEnter.relationship.merge(relationship);

                    relationshipOutline = svg.selectAll('.relationship .outline');
                    relationshipOutline = relationshipEnter.outline.merge(relationshipOutline);

                    relationshipOverlay = svg.selectAll('.relationship .overlay');
                    relationshipOverlay = relationshipEnter.overlay.merge(relationshipOverlay);

                    relationshipText = svg.selectAll('.relationship .textPath');
                    relationshipText = relationshipEnter.text.merge(relationshipText);
                }

                function version() {
                    return VERSION;
                }

                function zoomFit(transitionDuration) {
                    var bounds = svg.node().getBBox(),
                        parent = svg.node().parentElement.parentElement,
                        fullWidth = parent.clientWidth,
                        fullHeight = parent.clientHeight,
                        width = bounds.width,
                        height = bounds.height,
                        midX = bounds.x + width / 2,
                        midY = bounds.y + height / 2;

                    if (width === 0 || height === 0) {
                        return; // nothing to fit
                    }

                    svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
                    svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

                    svg.attr('transform', 'translate(' + svgTranslate[0] + ', ' + svgTranslate[1] + ') scale(' + svgScale + ')');
                    smoothTransform(svgTranslate, svgScale);
                }

                init(_selector, _options);

                return {
                    neo4jDataToD3Data: neo4jDataToD3Data,
                    size: size,
                    updateWithD3Data: updateWithD3Data,
                    updateWithNeo4jData: updateWithNeo4jData,
                    version: version
                };
            }

            module.exports = Neo4jD3;

        },{}]},{},[1])(1)
});
