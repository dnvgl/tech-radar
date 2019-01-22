export default function () {

  var
    width = 600,
    height = 400,
    minimumSize = 0.2,

    sizeFunction = function (item) {
      return item.people.length
    },
    nameFunction = function (item) {
      return item.technology.name
    },
    visibilityFunction = function (item) {
      return item.technology.visible
    },
    classNameFunction = function (item) {
      return item.className;
    },
    selection,
    chart,
    bubbles,
    bubbleItems,
    simulation,
    visibleItems,
    radiusScale;

  function chart(context) {
    selection = context.selection ? context.selection() : context;

    // console.log("Generating tech chart " + width + "x" + height)
    var items = selection.datum();

    selection.selectAll("svg").data([1]).enter().append("svg");

    var svg = selection.select("svg")
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("g").data([1]).enter().append("g").attr("class", "chart");
    chart = svg.select(".chart");
    chart.attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")");

    bubbleItems = items.map(function (t) {
      return {
        technology: t,
        radius: 0
      }
    });

    visibleItems = bubbleItems.filter(function (item) {
      return visibilityFunction(item.technology)
    });

    var total = visibleItems.reduce(function (total, item) {
      return total + sizeFunction(item.technology)
    }, 0);

    radiusScale = 1 / total;

    simulation = d3.forceSimulation()
      .velocityDecay(0.5)
      .force("charge", d3.forceManyBody().strength(1))
      .force("center", d3.forceCenter(0, 0))
      .force("y", d3.forceY(0))
      .force("x", d3.forceX(0))
      .force("collision", d3.forceCollide(function (d) {
        return getRadius(d.technology)
      }).iterations(20));

    simulation.stop();
    simulation.nodes(visibleItems)
      .on("tick", ticked)
      .on("end", function () {
        //  return simulation.restart()
      });
    simulation.alpha(0.3).restart()
  }

  function ticked() {
    bubbles = chart.selectAll("g").data(visibleItems);

    var bubblesEnter = bubbles.enter().append("g").on("click", function (d) {
      selection.dispatch("selected", {
        detail: d.technology
      })
    });
    bubblesEnter.append("circle").append("title").text(function (d) {
      return nameFunction(d.technology);
    }).attr("r", function (d) {
      return getRadius(d.technology);
    });
    bubblesEnter.append("text").attr("x", 0).attr("y", 0);

    bubbles.exit().remove()

    bubblesEnter.merge(bubbles).select("circle").attr("r", function (d) {
      return getRadius(d.technology);
    });
    bubblesEnter.merge(bubbles).attr("class", function (d) {
      return classNameFunction(d.technology);
    }).attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    }).select("text").html(function (d) {
      return nameFunction(d.technology);
    });
  }

  function getRadius(item) {
    var n = Math.max(sizeFunction(item), minimumSize);
    return Math.sqrt(n * radiusScale) * 100;
  }

  chart.size = function (_) {
    if (!arguments.length) {
      return [width, height];
    }
    width = _[0];
    height = _[1];
    return techRadar;
  };

  chart.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return techRadar;
  };

  chart.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return techRadar;
  };

  return chart;
}