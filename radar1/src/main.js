function technologyRadar(config) {
    var technologies = [];
    var projects = [];
    var people = [];

    var radarItems = [];
    var radarGroup;
    var radarSimulation;

    var bubbleItems = [];
    var bubbleGroup;
    var bubblechartSimulation;

    $(document).ready(pageReady);

    function pageReady() {
        if (isInSharepointDesignMode()) return;

        if (isIE()) {
            console.log("IE is not supported yet.");
            $(config.warningContainerId).attr("style", "");
            return;
        }

        // hide the tech radar until all data sets have been loaded
        $(config.containerId).hide();

        initHeader();

        // load D3 and the data sets
        loadD3(function () {
            return loadTechnologies(function () {
                return loadProjects(function () {
                    return loadPeople(initialize)
                })
            })
        });

        // initialize the results nav bar
        initTabs(config.results.tabsQuery);

        // subscribe to change events on the search text box
        $(config.searchInputId).on('input propertychange paste', applyFilter);
    }

    function loadTechnologies(callback) {
        showInfo("Loading technologies...");
        get(config.technologiesUrl, function (json) {
            // console.log("Loaded " + json.length + " technologies.");
            technologies = json;
            callback()
        })
    }

    function loadProjects(callback) {
        showInfo("Loading projects...");
        get(config.projectsUrl, function (json) {
            projects = json;
            callback()
        })
    }

    function loadPeople(callback) {
        showInfo("Loading people...");
        get(config.peopleUrl, function (json) {
            people = json;
            initPeople();
            callback()
        })
    }

    function initialize() {
        createFilterButtons(technologies);
        initSearch();
        createRadar(technologies);
        createBubbleChart(technologies);
        showInfo("Completed.");
        $(config.infoContainerId).hide();
        $(config.containerId).show();
        applyFilter();
        select()
    }

    function showInfo(text) {
        $(config.infoTextId).text(text);
    }

    function loadD3(callback) {
        $(config.infoTextId).text("Loading D3...");
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/d3/5.7.0/d3.min.js", function () {
            // console.log("D3 loaded successfully.");
            callback()
        })
    }

    function initHeader() {
        if (!window.URLSearchParams) return;
        const urlParams = new URLSearchParams(window.location.search);
        var noHeader = urlParams.get('no-header');
        if (noHeader) {
            $("header").hide();
        }
    }

    function initSearch() {
        if (!window.URLSearchParams) return;
        const urlParams = new URLSearchParams(window.location.search);
        var search = urlParams.get('search');
        if (search) {
            $(config.searchInputId).attr("value", search);
            applyFilter();
        }
    }

    function initPeople() {
        showInfo("Processing ask-me-about tags...");
        joinTechnologiesInString(people);
        if (config.countPeople) {
            for (var t of technologies) {
                t.people = matchTechnology(t, people);
            }
        }
    }

    function joinTechnologiesInString(items) {
        for (var item of items) {
            if (!Array.isArray(item.technologies)) continue;
            item.technologiesInString = "," + item.technologies.map(simplify).join() + ","
        }
    }

    function applyFilter() {
        var search = simplify($(config.searchInputId).val());

        var selectedCategories = getSelected(config.categoryFiltersId);
        var selectedTags = getSelected(config.tagFiltersId);
        var selectedAreas = getSelected(config.areaFiltersId);
        var selectedPhases = getSelected(config.phaseFiltersId);
        var selectedStatuses = getSelected(config.statusFiltersId);

        for (var t of technologies) {
            var text = simplify(t.name + t.description);
            var match = true;

            if (selectedCategories && selectedCategories.every(s => t.category != s)) match = false;
            if (selectedAreas && selectedAreas.every(s => config.sectorSelector(t) != s)) match = false;
            if (selectedPhases && selectedPhases.every(s => config.ringSelector(t) != s)) match = false;
            if (selectedStatuses && selectedStatuses.every(s => t.status != s)) match = false;
            if (selectedTags && selectedTags.some(s => t.tags && !t.tags.includes(s))) match = false;

            if (search && !text.includes(search)) match = false;
            t.visible = match;
        }

        var matchingTechnologies = technologies.filter(t => t.visible);
        $(config.results.numberOfResultsId).text(matchingTechnologies.length);

        updateList(matchingTechnologies, `${config.results.listByPhaseId} * .phase`, config.ringSelector);
        updateList(matchingTechnologies, `${config.results.listByAreaId} * .area`, config.sectorSelector);

        updateFilterStates(matchingTechnologies);
        updateRadar();
        updateBubbleChart(technologies);

        if (matchingTechnologies.length == 1) {
            select(matchingTechnologies[0]);
        } else {
            select();
        }
    }

    function updateList(items, query, selector) {
        $(query).each(function () {
            var key = $(this).attr('group-key');
            console.log(key);
            var list = $(this).find("ul");
            list.empty();
            var filterResult = items.filter(t => selector(t) == key);
            $(this).toggle(filterResult.length > 0);
            filterResult.sort(compareByName).forEach(t => {
                var item = createListItem(t);
                list.append(item)
            });
        });
    }

    function compareByName(a, b) {
        return a.name.localeCompare(b.name)
    }

    function createListItem(t) {
        var item = $('<li>');
        $('<a>').text(t.name).addClass(toClassName(t.category)).attr('href', '#').click(() => {
            select(t);
            return false;
        }).append(" ").appendTo(item);
        if (t.people && t.people.length > 0) $("<span>").addClass("badge numberOfPeople").text(t.people.length).appendTo(item);
        return item;
    }

    function updateProjectList(matchingProjects, technology) {
        var list = $(config.details.projectListId);
        list.empty();
        for (let project of matchingProjects) {
            var item = $('<div>').addClass('panel panel-default project');
            var question = `What is your experience with ${technology.name} in ${project.projectName}%3F`;
            var content = $('<div>').addClass('panel-heading name').text(project.projectName)
                .add($('<div>').addClass("panel-body")
                    .append($('<p>').text(project.comment))
                    .append(createMailto(project.contact.email, project.contact.name, question))
                    .append($('<div>').addClass('date').text(project.lastUpdate)));
            content.appendTo(item);
            item.appendTo(list);
        }

        if (matchingProjects.length == 0) {
            $('<div>').text('No matches.').appendTo(list);
        }
    }

    function updatePeopleList(matchingPeople, technology) {
        var list = $(config.details.peopleListId);
        list.empty();
        for (let person of matchingPeople.sort(compareByName)) {
            var meUrl = person.me.replace('i:0#.w|', '').replace('\\\\', '%5C');
            var link = $('<a>').attr('href', meUrl).attr('target', '_blank');
            var item = $('<div>').addClass('person');
            var image = $('<img>').attr('src', person.picture)
                .on('error', function () {
                    $(this).attr('src', config.avatarImageUrl);
                });
            var details = $('<div>').addClass('details');
            var name = $('<div>').addClass('name').text(person.name);
            var question = `May I ask you something about ${technology.name}%3F`;
            var mailtoLink = createMailto(person.contact, person.contact, question);
            var phone = $('<div>').addClass('phone').text(person.mobile);

            name.appendTo(details);
            mailtoLink.appendTo(details);
            phone.appendTo(details);
            image.appendTo(item);
            details.appendTo(item);
            item.appendTo(link);
            link.appendTo(list);
        }
        if (matchingPeople.length == 0) {
            $('<div>').text('No matches.').appendTo($(config.peopleListId));
        }
    }

    function select(technology) {
        $(config.details.id).toggle(technology != null);
        if (!technology) {
            return;
        }

        $(config.details.titleId).text(technology.name);
        $(config.details.descriptionId).html(technology.description);

        var matchingProjects = matchTechnology(technology, projects);
        updateProjectList(matchingProjects, technology);

        var matchingPeople = matchTechnology(technology, people);
        updatePeopleList(matchingPeople, technology);
    }

    function matchTechnology(technology, items) {
        if (!items) return [];
        var tags = technology.tags.map(simplify);
        tags.push(simplify(technology.name));
        return items.filter(function (p) {
            if (p.technologiesInString) {
                return tags.some(function (tag) {
                    return p.technologiesInString.includes("," + tag + ",")
                })
            }
            return Array.isArray(p.technologies) && p.technologies.some(function (t) {
                if (!t) return false;
                t = simplify(t);
                return tags.some(function (tag) {
                    return t == tag
                })
            })
        })
    }

    function createFilterButtons(items) {
        var _categories = items.map(t => t.category);
        var _areas = items.map(config.sectorSelector);
        var _phases = items.map(config.ringSelector);
        var _tags = items.map(t => t.tags);
        if (_tags.length > 0) _tags = _tags.reduce((a, b) => a.concat(b));
        var _statuses = items.map(t => t.status);

        function _add(id, items) {
            parent = $(id);
            if (!parent) return;
            parent.empty();
            var uniqueItems = [...new Set(items)];
            for (let item of uniqueItems) {
                let button = $('<div>').attr('value', item).addClass('filter-button');
                button.addClass(toClassName(item));
                if (!config.inactiveFilterButtons.some(tag => tag == item)) {
                    button.addClass('active');
                }
                // if (id == '#tag_filters') button.addClass('active');
                button.click(() => {
                    if (button.attr('disabled')) return;
                    button.toggleClass('active');
                    applyFilter();
                });
                button.appendTo(parent);
            }
        }

        _add(config.categoryFiltersId, _categories);
        _add(config.areaFiltersId, _areas);
        _add(config.phaseFiltersId, _phases);
        _add(config.tagFiltersId, _tags);
        _add(config.statusFiltersId, _statuses);
    }

    function updateFilterStates(items) {
        if (!items) return;

        var _categories = items.map(t => t.category);
        var _areas = items.map(config.sectorSelector);
        var _phases = items.map(config.ringSelector);
        var _tags = items.map(t => t.tags);
        if (_tags.length > 0) _tags = _tags.reduce((a, b) => a.concat(b));
        var _statuses = items.map(t => t.status);

        function _update(id, items) {
            $(id).children().each(function () {
                let n = items.filter(item => item == $(this).attr('value')).length;
                // $(this).toggle(visible);
                // $(this).attr('disabled', n == 0);
                var value = $(this).attr('value');
                $(this).text(value + (n > 0 ? (' (' + n + ')') : ''));
            });
        }

        _update(config.categoryFiltersId, _categories);
        _update(config.areaFiltersId, _areas);
        _update(config.phaseFiltersId, _phases);
        _update(config.tagFiltersId, _tags);
        _update(config.statusFiltersId, _statuses);
    }

    function createRadar(items) {
        if (!window.d3) {
            console.log("D3 is not loaded.");
            return;
        }

        var svg = d3.select(config.radar.id)
        //  .attr("width", config.radar.width)
        //  .attr("height", config.radar.height);
        var w = config.radar.width;
        var h = config.radar.height;
        var r = Math.min(w, h) / 2 * 0.8;

        var radar = svg.append("g");
        radar.attr("transform", `translate(${w / 2}, ${h / 2})`);

        var rings = getRings(r);
        var sectors = getSectors(items);

        // add the rings
        var ringGroup = radar.append("g").attr("class", "rings");
        var ringsArray = [];
        for (var property in rings) {
            var ring = rings[property];
            ringsArray.push(ring);
        }

        for (var ring of ringsArray.sort((a, b) => a.r0 > b.r0 ? -1 : 1)) {
            ringGroup.append("circle").attr("cx", 0).attr("cy", 0).attr("r", ring.r1).attr("class", ring.name);
        }

        // add the sector lines and labels
        var sectorGroup = radar.append("g").attr("class", "sectors");
        for (var property in sectors) {
            var sector = sectors[property];
            sectorGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -r).attr("transform", `rotate(${sector.from})`);

            // sector label
            var labelGroup = sectorGroup.append("g").attr("class", "sector").attr("transform", `rotate(${180+(sector.from+sector.to)/2})`);

            // calculate the path for the label
            var t = (sector.to - sector.from) * Math.PI / 180;
            var r2 = r + 20;
            var x = r2 * Math.sin(t / 2.1);
            var y = r2 * Math.cos(t / 2.1);
            var d = `M${x} ${y} A ${r2} ${r2} 0 0,1 ${-x} ${y}`;
            var mid = (sector.to + sector.from) / 2 + 180;
            if (mid % 360 < 90 || mid % 360 > 270)
                d = `M${-x} ${y} A ${r2} ${r2} 0 0,0 ${x} ${y}`;

            var id = `textpath_${property}`;
            labelGroup.append('path').attr("id", id).attr("d", d);
            var text = labelGroup.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "middle");
            text.append("textPath").attr("startOffset", "50%").attr("href", "#" + id).html(sector.name);
        }

        // add the ring labels
        var ringLabelGroup = radar.append("g").attr("class", "rings");
        for (var property in rings) {
            var ring = rings[property];
            var text = ringLabelGroup.append("text").attr("class", ring.name).attr("x", 0).attr("y", ring.r0 * (1 - ring.labelPos) + ring.r1 * ring.labelPos).attr("text-anchor", "middle").attr("dominant-baseline", "middle").html(ring.title);
        }

        technologies.forEach(t => {
            var phase = config.ringSelector(t);
            var area = config.sectorSelector(t);
            t.sector = sectors[area.toLowerCase()];
            t.ring = rings[phase.toLowerCase()];
            if (!t.sector) {
                console.log("Invalid sector: " + area);
                return;
            }
            if (!t.ring) {
                console.log("Invalid ring: " + phase);
                return;
            }

            var angle = random(t.sector.from, t.sector.to);
            var r = random(t.ring.r0, t.ring.r1);
            var pt = toCartesian(r, angle);
            t.x = pt.x;
            t.y = pt.y;
            t.center = toCartesian((t.ring.r0 + t.ring.r1) * 0.5, (t.sector.from + t.sector.to) * 0.5)
        });

        radarItems = technologies.map(function (t) {
            return {
                technology: t,
                x: t.x,
                y: t.y
            }
        });
        radarGroup = radar.append("g").attr("class", "blips");
        radarSimulation = d3.forceSimulation()
            .velocityDecay(0.5)
            .force("charge", d3.forceManyBody().strength(-1))
            .force("collision", d3.forceCollide(config.radar.blipRadius * 2))
    }

    function keepBlipInside(d) {
        var t = d.technology;
        if (!t.sector || !t.ring) return;
        var polar = toPolar(d.x, d.y);
        var changed = false;
        var da = config.radar.blipRadius / polar.r / Math.PI * 180;
        if (polar.angle > t.sector.to - da) {
            polar.angle = t.sector.to - da;
            changed = true;
        }
        if (polar.angle < t.sector.from + da) {
            polar.angle = t.sector.from + da;
            changed = true;
        }
        if (polar.r < t.ring.r0 + config.radar.blipRadius) {
            polar.r = t.ring.r0 + config.radar.blipRadius;
            changed = true;
        }
        if (polar.r > t.ring.r1 - config.radar.blipRadius) {
            polar.r = t.ring.r1 - config.radar.blipRadius;
            changed = true;
        }
        if (changed) {
            var xy = toCartesian(polar.r, polar.angle);
            d.x = xy.x;
            d.y = xy.y;
        }
    }

    function radarTicked() {
        var blips = radarGroup.selectAll("g")
            .data(radarItems.filter(function (i) {
                return i.technology.visible
            }));

        var blipsEnter = blips.enter()
            .append("g")
            .on("click", d => select(d.technology))

        blipsEnter.append("circle")
            .attr("r", config.radar.blipRadius)
            .append("title").text(d => d.technology.name);

        blipsEnter.append("text")
            .attr("x", 0)
            .attr("y", -(config.radar.blipRadius + 2));

        blipsEnter.merge(blips)
            .attr("class", d => `blip ${toClassName(d.technology.category)} ${toClassName(config.sectorSelector(d.technology))} ${toClassName(config.ringSelector(d.technology))} ${d.technology.status}`)
            .attr("transform", function (d) {
                keepBlipInside(d);
                return `translate(${d.x},${d.y})`;
            })
            .select("text")
            .html(d => d.technology.name);

        blips.exit().remove();
    }

    function updateRadar() {
        radarSimulation.stop();
        radarSimulation
            .nodes(radarItems.filter(item => item.technology.visible))
            .on("tick", radarTicked)
            .on("end", () => radarSimulation.restart())
            .restart();
    }

    function getSectors(items) {
        var sectors = config.radar.sectors ? config.radar.sectors : [...new Set(items.map(config.sectorSelector))];
        var dictionary = {};
        var w = 360 / sectors.length;
        sectors.forEach((sectorTitle, i) => {
            var name = sectorTitle.toLowerCase();
            dictionary[name] = {
                name,
                title: sectorTitle,
                from: i * w,
                to: (i + 1) * w
            };
        });
        return dictionary;
    }

    function getRings(r) {
        var rings = config.radar.rings ? config.radar.rings : [...new Set(items.map(config.ringSelector))];
        var n = rings.length;
        var dictionary = {}
        rings.forEach((title, i) => {
            var name = title.toLowerCase();
            var from = Math.sqrt(i / n);
            var to = Math.sqrt((i + 1) / n);
            dictionary[name] = {
                name,
                title,
                from,
                to,
                r0: from * r,
                r1: to * r,
                labelPos: i < n - 1 ? 0.5 : 0.7
            }
        });

        return dictionary;
    }

    function createBubbleChart(items) {
        if (!window.d3) {
            console.log("D3 is not loaded.");
            return
        }
        var w = config.bubblechart.width;
        var h = config.bubblechart.height;
        var svg = d3.select(config.bubblechart.id);
        // svg.attr("width", w).attr("height", h);
        var radar = svg.append("g");
        radar.attr("transform", "translate(" + w / 2 + ", " + h / 2 + ")");
        var maxPeople = items.reduce((max, item) => Math.max(max, item.people.length), 0);
        var totalPeople = items.reduce((total, item) => total + item.people.length, 0);
        console.log(maxPeople);
        bubbleItems = items.map(function (t) {
            return {
                "radius": getRadius(t, 1 / totalPeople),
                "technology": t
            }
        });
        bubbleGroup = radar.append("g").attr("class", "bubblechart");
        bubblechartSimulation = d3.forceSimulation()
            .velocityDecay(0.5)
            .force("charge", d3.forceManyBody().strength(1))
            .force("center", d3.forceCenter(0, 0))
            .force("y", d3.forceY(0))
            .force("x", d3.forceX(0))
            .force("collision", d3.forceCollide(function (d) {
                return d.radius
            }).iterations(20))
    }

    function updateBubbleChart(items) {
        bubblechartSimulation.stop();
        bubblechartSimulation.nodes(bubbleItems.filter(function (d) {
            return d.technology.visible
        })).on("tick", bubblechartTicked).on("end", function () {
            return bubblechartSimulation.restart()
        });
        bubblechartSimulation.alpha(0.3).restart()
    }

    function getRadius(technology, scale) {
        var n = Math.max(technology.people ? technology.people.length : 0, config.bubblechart.minimumSize);
        return Math.sqrt(n * scale) * 100;
    }

    function bubblechartTicked() {
        var blips = bubbleGroup.selectAll("g").data(bubbleItems.filter(function (d) {
            return d.technology.visible;
        }));
        var blipsEnter = blips.enter().append("g").on("click", function (d) {
            return select(d.technology);
        });
        blipsEnter.append("circle").append("title").text(function (d) {
            return d.technology.name;
        }).attr("r", function (d) {
            return d.radius;
        });
        blipsEnter.append("text").attr("x", 0).attr("y", 0);
        blipsEnter.merge(blips).select("circle").attr("r", function (d) {
            return d.radius;
        });
        blipsEnter.merge(blips).attr("class", function (d) {
            return "bubblechart " + toClassName(d.technology.category) + "  " + toClassName(config.sectorSelector(d.technology)) + " " + toClassName(config.ringSelector(d.technology)) + " " + toClassName(d.technology.status);
        }).attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        }).select("text").html(function (d) {
            return d.technology.name;
        });
        blips.exit().remove()
    }
}