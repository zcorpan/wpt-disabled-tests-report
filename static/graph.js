const produceGraph = () => {
  var svg = d3.select("svg").html(''),
      margin = {top: 20, right: 80, bottom: 30, left: 50},
      width = window.innerWidth - 8 - 60 - margin.left - margin.right, // svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var parseTime = d3.timeParse("%Y-%m-%d");

  var x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),// d3.scalePow().exponent(0.5).range([height, 0]),
      z = d3.scaleOrdinal(d3.schemeCategory10);

  var line = d3.line()
      // .curve(d3.curveBasis)
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.tests); });

  var pos = 0;
  function positionLegend() {
    var labelWidth = width / 12;
    pos += labelWidth;
    return pos;
  }

  const landmarks = {
    'May 31 2018': [ 'Added Chromium NeverFixTests' ],
    // 'July 29 2018': 'Added Chromium SlowTests',
    'April 2020': [ 'Missing Chromium data' ],
    'July 31 2020': [ 'Fixed Chromium data' ],
    'December 11 2020': [ 'Stopped running' ],
    // 'September 18 2023': 'Fork revival',
    /* 19 */ 'September 18 2023': [ 'Added Gecko flaky+timeout', 'Fork revival' ]
  };

  d3.csv("data.csv", type, function(error, data) {
    if (error) throw error;

    const columns = data.columns;
    const beginning = document.getElementById('start-input').valueAsDate ?? new Date('June 1 2018');
    document.getElementById('start-input').valueAsDate = beginning;

    data = data.filter(x => x.date > beginning);

    var groups = columns.slice(1).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {date: d.date, tests: d[id]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));

    y.domain([
      d3.min(groups, function(c) { return d3.min(c.values, function(d) { return d.tests; }); }),
      d3.max(groups, function(c) { return d3.max(c.values, function(d) { return d.tests; }); })
    ]);

    z.domain(groups.map(function(c) { return c.id; }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).tickArguments([6]))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Tests");

    for (const l in landmarks) {
      const p = x(new Date(l));
      if (p < 0) continue;

      const gr = g.append("g")
        .attr("transform", `translate(${p}, 0)`);

      gr.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", height)
          .style("stroke", "rgba(0, 0, 0, 0.4)")
          .style("stroke-dasharray", 4);

      let p2 = 0
      for (const t of landmarks[l]) {
        p2 += t.length * -6;
        gr.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", p2)
            .attr("y", 5)
            .attr("dy", "0.71em")
            .style("font", "10px sans-serif")
            .attr("fill", "#000")
            .text(t);
        p2 -= 40;
      }
    }

    var group = g.selectAll(".group")
      .data(groups)
      .enter().append("g")
        .attr("class", "group");

    group.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return z(d.id); });

    console.log([ x.invert(100) ]);

    group.append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) {
          // find y of location for this id at position legend
          const p = positionLegend(), date = x.invert(p);
          const p2 = data.find(x => x.date > date)[d.id];

          return "translate(" + p + ", " + (y(p2) - 8) + ")";
        })
        .style("font", "10px sans-serif")
        .style("fill", function(d) { return z(d.id); })
        .text(function(d) { return d.id; });
  });

  function type(d, _, columns) {
    d.date = parseTime(d.date);
    for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
    return d;
  }
};

produceGraph();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-input').onchange = produceGraph;
});