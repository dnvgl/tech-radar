var tape = require("tape"),
    techRadar = require("..");

tape("The tech radar has a default width.", function(test) {
  var radar = techRadar();
  test.equal(radar.width(), 600);
  test.end();
});
