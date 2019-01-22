# Technology Radar by DNV GL

A technology radar used to visualize our technology choices and competence within the organization.

This repo contains both web apps, components and plugins. You can reuse the application as it is with your own data, or import
the component or plugin packages and create your own solution.

## Features

The [d3-tech-radar] D3 plugin 

- renders any number of topics (radar sectors)
- renders any number of phases (radar rings) 
- uses a force-based layout

The [d3-tech-bubblechart] D3 plugin

- renders bubbles sized by a scalar value
- uses a force-based layout

The [radar1] demo app can

- filter by category (e.g. domains)
- filter by topic areas (the radar sectors/quadrants)
- filter by phases (the radar rings)
- filter by attributes/tags
- filter by status of evaluation (technologies can be shown before the evaluation is complete)
- do full-text search
- display results (matching technologies) in list views
- display results in radar view
- display results in bubble chart view
- list people in the organization that have marked their profile with the selected technology

## The data sets

The included data sets contain dummy data only. The apps included in this repository is using three datasets:

- [Technologies] - list of technologies with categories, areas, phases and status
- [Projects] - list of projects using the technologies
- [People] - list of people with knowledge about the technologies

The datasets can be hosted on a static file server, or loaded dynamically from a REST API.
The size of these datasets is quite small, so currently the apps are reading all the data into memory when they are starting.

## Getting started

This is a monorepo based on yarn workspaces.

Run `yarn` to install the dependencies.

To run og build the sample tech radar app
- `yarn workspace radar1 start`
- `yarn workspace radar1 build`

To test and build the D3 plugins
- `yarn workspace @dnvgl/d3-tech-bubblechart test`
- `yarn workspace @dnvgl/d3-tech-radar test`
- `yarn workspace @dnvgl/d3-tech-bubblechart prepublish`
- `yarn workspace @dnvgl/d3-tech-radar prepublish`

## How to use the D3 plugins in your own solution

```
TODO
```

[Technologies]: https://raw.githubusercontent.com/dnvgl/tech-radar/master/data/technologies.json
[Projects]: https://raw.githubusercontent.com/dnvgl/tech-radar/master/data/projects.json
[People]: https://raw.githubusercontent.com/dnvgl/tech-radar/master/data/people.json

[radar1]: https://dnvgl.github.io/tech-radar/radar1/
[d3-tech-radar]: https://github.com/dnvgl/tech-radar/tree/master/d3-tech-radar
[d3-tech-bubblechart]: https://github.com/dnvgl/tech-radar/tree/master/d3-tech-bubbleChart
