var tape = require("tape"),
    techBubbleChart = require("../build/d3-tech-bubblechart");

tape("The tech bubble chart has a default width.", function(test) {
  var chart = techBubbleChart();
  test.equal(chart.width(), 600);
  test.end();
});
