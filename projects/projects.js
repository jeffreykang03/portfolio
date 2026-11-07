import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = (await fetchJSON('../lib/projects.json')) ?? [];

const projectsContainer = document.querySelector('.projects');

// Step 1.6 (Lab 4): show the project count in the page title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

// Filter state
let query = '';
// Extra credit: remember the selected wedge by its year label instead of
// by index (selectedIndex), because indexes shift when the search removes years.
let selectedYear = null;

// Colors are keyed by year, so a year keeps its color while filtering
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function matchesQuery(project) {
  let values = Object.values(project).join('\n').toLowerCase();
  return values.includes(query.toLowerCase());
}

// Extra credit 
function getFilteredProjects() {
  return projects.filter(
    (project) =>
      matchesQuery(project) &&
      (selectedYear === null || project.year === selectedYear),
  );
}

function updateProjects() {
  renderProjects(getFilteredProjects(), projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
  // Count projects per year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  rolledData.sort((a, b) => d3.ascending(a[0], b[0]));

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value).sort(null);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  // Clear the old pie and legend before redrawing
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  function highlightSelection() {
    svg
      .selectAll('path')
      .attr('class', (_, idx) => (data[idx].label === selectedYear ? 'selected' : ''));
    legend
      .selectAll('li')
      .attr('class', (_, idx) =>
        data[idx].label === selectedYear ? 'legend-item selected' : 'legend-item',
      );
  }

  function select(i) {
    selectedYear = selectedYear === data[i].label ? null : data[i].label;
    highlightSelection();
    updateProjects();
  }

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .on('click', () => select(i));
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => select(i));
  });

  highlightSelection();
}

// Initial render on page load
renderPieChart(projects);
updateProjects();

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  // The pie shows every year in the search results; the cards use both filters
  renderPieChart(projects.filter(matchesQuery));
  updateProjects();
});
