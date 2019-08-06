//begin script when window loads
document.addEventListener("DOMContentLoaded", init);

	//set choropleth map parameters
    function init(){
        /* DATA */
        var countryCodes, europeGeoJson, csvData, dataset = "CoL_Index";

		/* MAP */
		//map frame dimensions
		var width = 600;
	  	var height = 600;

		//create a new svg element with the above dimensions
		var map = d3.select('body')
			.append('svg')
			.attr('width', width)
			.attr('height', height);

    //create Europe Albers equal area conic projection
		var projection = d3.geoAlbers()
			.center([2, 52])
			.rotate([-10, 0])
			.parallels([43, 62])
			.scale(1000)
			.translate([width / 2, height / 2]);

		//create svg path generator using the projection
		var path = d3.geoPath(projection);

		/* HEADER */
		//label
		d3.select("body").append("header");
		var header = document.querySelector("header");
		header.innerHTML = `
			<h1>2019 Cost of Living Index</h1>
      <h3>Data provided by <a href="https://www.numbeo.com/cost-of-living/">Numbeo's </a>database of contributed data.</h3>

      <style>
          button { padding: 5px 15px; border-radius: 5px; border: 1px solid black; background: linear-gradient(lightgoldenrodyellow, #DAA520);}
          button:hover { background: linear-gradient(#DAA520, lightgoldenrodyellow); }
          h5 { font-family: "Noto Sans", sans-serif; font-size: 25px; font-weight: bold; text-align: center; margin: 1;}
          h3 { font-family: "Noto Sans", sans-serif; font-size: .85em; font-weight: normal; text-align: left; margin: 1;}
          h2 {font-family: "Noto Sans", sans-serif; font-size: 1.5em; font-weight: bold;}
          h1 { font-family: "Noto Sans", sans-serif; font-size: 2em; font-weight: bold; text-align: left; margin: 0;}
      </style>
			<nav>
				<button data-index="CoL_Index">Cost of Living</button>
				<button data-index="Local_PP_Index">Local Purchasing Power</button>
				<button data-index="Rent_Index">Rent</button>
				<button data-index="Groceries_Index">Groceries</button>
				<button data-index="Restaurant_Index">Restaurant</button>
			</nav>
			<h2></h2>

		`;
        var title = header.querySelector("h1");
		var output = header.querySelector("h2");

		/* BAR CHART */
      	//bar chart
      	var margin = {top: 10, right: 0, bottom: 40, left: 30},
            barWidth = 700 - margin.left - margin.right,
            barHeight = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg = d3.select("body").append("svg")
            .attr("width", barWidth + margin.left + margin.right)
            .attr("height", barHeight + margin.top + margin.bottom)
          	.append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        /* ASSETS */
        //load assets
		;(async function getAsyncAssets(){
			let csvData = await d3.csv('data/data.csv'),
				europeData = await d3.json('data/map.topojson');
				//europeData = await d3.json('data/map.topojson');
			callback(null, csvData, europeData);
		})();

        //assets loaded
		function callback(error, csvDataset, europeData){
            csvData = csvDataset;
			console.log(csvData);
			countryCodes = csvData.map(c => c.Country_Code);
			europeGeoJson = topojson.feature(europeData,europeData.objects.ne_50m_admin_0_countries);
          	console.log(europeGeoJson);
            displayData();
        }

        /* OUTPUT */
        function displayData(){
          	/* BAR CHART */
            // set the ranges
            var x = d3.scaleBand()
                      .range([0, barWidth])
                      .padding(0.2);
            var y = d3.scaleLinear()
                      .range([barHeight, 0]);

          	x.domain(csvData.map(function(d){ return d.Country_Code; }));
          	//y.domain([0, d3.max(csvData, function(d){ return d[dataset]; })]);
          	y.domain([0, Math.max(...csvData.map(d => d[dataset]))]);

          	svg.selectAll(".bar")
              	.data(csvData)
          		.enter()
          		.append("rect")
				.attr("data-code", function(d){ return d.Country_Code; })
          		.attr("fill", getColor)
          		.attr("class", "bar")
          		.attr("x", function(d) { return x(d.Country_Code); })
          		.attr("width", x.bandwidth())
          		.attr("y", function(d) { return y(+d[dataset]); })
          		.attr("height", function(d) { return barHeight - y(+d[dataset]); });

          	// add the x Axis
            svg.append("g")
				.style("font", "7px sans-serif")
                .attr("transform", "translate(0," + barHeight + ")")
                .call(d3.axisBottom(x));

            // add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y));

          	/* MAP */
			var countries = map.append('path') //create SVG path element
				.datum(europeGeoJson)
				.attr('class', 'countries') //class name for styling
				.attr('d', path); //project data as geometry in svg

          	map
            	.append("g")
          		.selectAll("path")
          		.data(europeGeoJson.features)
          		.enter()
          		.append("path")
				.attr("fill", getColor)
				.attr("data-code", c => c.properties.SOV_A3)
          		.attr("d", path);

      //data codes represent selector values
			document.querySelectorAll("[data-code]").forEach(el => {
				let code = el.getAttribute("data-code");
				if (countryCodes.includes(code)){
					el.addEventListener("mouseover", handleMouseover);
					el.addEventListener("mouseout", handleMouseout);
				}
			});

      //handleMouseover function outlines country polygons or bar by country code
			function handleMouseover(e){
				let code = e.currentTarget.getAttribute("data-code"),
					countryData = csvData.filter(c => c.Country_Code === code)[0],
					countryName = countryData.Name,
                    countryIndex = countryData[dataset];
				output.innerHTML = countryName + "<br /> " + countryIndex;
				document.querySelectorAll(`[data-code=${code}]`).forEach(el => {
					el.setAttribute("stroke", "red");
					el.setAttribute("stroke-width", 2.75);
				});
			}

      //handleMouseout function deselects previous country polygon or bar
			function handleMouseout(e){
				let code = e.currentTarget.getAttribute("data-code");
				document.querySelectorAll(`[data-code=${code}]`).forEach(el => {
					el.removeAttribute("stroke");
					el.removeAttribute("stroke-width");
				});
				output.innerHTML = "";
			}

			function getColor(country){
              	//country can be one of two things: csvData or geoJson
				let code;
              	//geoJson?
				if (country.properties && country.properties.SOV_A3) code = country.properties.SOV_A3;
              	//or csvData?
				else if (country.Country_Code) code = country.Country_Code;
              	//either way, find the rank and define color based on rank
	  	  		if (countryCodes.includes(code)){
	  	  			let rank = Number(csvData.filter(c => c.Country_Code === code)[0].Rank),
						hue = 150 - rank,
						lightness = rank * 2 + 10;
					return `hsl(${hue}, 80%, ${lightness}%)`;
	  	  		}
	  	  		return "silver";
	  	  	}
		};
        //updates data sets on click
        header.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", handleClick);
        });
        //remove multiple clicking options - only loads once
        function handleClick(e){
            let newDataset = e.currentTarget.getAttribute("data-index");
            if (dataset === newDataset) return;
            //change dataset and csv rankings
            dataset = newDataset;
            title.innerHTML = "2019 " + e.currentTarget.textContent + " Index";
            csvData.sort((a,b) => b[dataset] - a[dataset]);
            csvData.forEach((el,index) => el.Rank = index+1);
            //remove old map and bar chart
            map._groups[0][0].innerHTML = "";
            svg._groups[0][0].innerHTML = "";
            //redraw
            displayData();
        }
	}
