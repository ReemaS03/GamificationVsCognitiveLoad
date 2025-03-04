import { fetchJSON } from './fetch-data.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];
let xScale, yScale;

// Set default values for the dropdowns
let selectedDevice = "Empatica E4";  
let selectedSession = "2";  // Default to session 2
let selectedCondition = "baseline";  // Default to baseline
let selectedBiometric = "avg_bvp";  
let selectedBiometricDisplay = "Average Blood Volume Pulse (BVP)"; 

// Dropdown elements
let deviceDropdown, sessionDropdown, conditionDropdown;

async function loadData() {
    data = await fetchJSON(`./empatica_bvp_post_baseline.json`); // Adjust the path to your JSON data
    if (!data || data.length === 0) {
        console.error('No data found or failed to load data');
        return;  // Exit if no data is loaded
    }
    console.log("Loaded Data:", data);
    createScatterplot(); 
}

document.addEventListener('DOMContentLoaded', () => {
    // Create the dropdowns when the page is loaded
    createDropdowns();
    loadData();
});

// Function to create and append dropdowns dynamically
function createDropdowns() {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.id = 'dropdown-container';
    dropdownContainer.style.textAlign = 'center';
    dropdownContainer.style.marginTop = '20px';

    // Create the Device dropdown
    deviceDropdown = createDropdown(
        'Device: ', 
        'device', 
        ['Empatica E4 watch', 'Samsung Galaxy Watch4', 'Muse S EEG headband'], 
        selectedDevice
    );
    dropdownContainer.appendChild(deviceDropdown);

    // Create the Experiment Session dropdown
    sessionDropdown = createDropdown(
        'Experiment Session: ', 
        'experiment-session', 
        ['Session 1', 'Session 2'], 
        selectedSession
    );
    dropdownContainer.appendChild(sessionDropdown);

    // Create the Condition dropdown
    conditionDropdown = createDropdown(
        'Condition: ', 
        'condition', 
        ['baseline', 'cognitive_load', 'survey'], 
        selectedCondition
    );
    dropdownContainer.appendChild(conditionDropdown);

    // Append the dropdown container to the body (or any other element like a chart container)
    document.body.appendChild(dropdownContainer);

    // Add event listeners to handle dropdown changes
    deviceDropdown.querySelector('select').addEventListener('change', updateSelections);
    sessionDropdown.querySelector('select').addEventListener('change', updateSelections);
    conditionDropdown.querySelector('select').addEventListener('change', updateSelections);
}

// Function to create a dropdown element
function createDropdown(labelText, dropdownId, options, selectedOption) {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';

    const label = document.createElement('label');
    label.setAttribute('for', dropdownId);
    label.textContent = labelText;
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = dropdownId;

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.toLowerCase().replace(' ', '_');  // Normalize option value to lowercase with underscores
        optionElement.textContent = option;
        if (option === selectedOption) {
            optionElement.selected = true;  // Set default selected option
        }
        select.appendChild(optionElement);
    });

    container.appendChild(select);
    return container;
}

// Update selections based on dropdown values
function updateSelections() {
    selectedDevice = deviceDropdown.querySelector('select').value;
    selectedSession = sessionDropdown.querySelector('select').value;
    selectedCondition = conditionDropdown.querySelector('select').value;

    // Log the updated values for now (you can use them to filter data, update plot, etc.)
    console.log('Selected Device:', selectedDevice);
    console.log('Selected Session:', selectedSession);
    console.log('Selected Condition:', selectedCondition);
}

function createScatterplot() {
    if (!data || data.length === 0) {
        console.error('No data available to plot');
        return;  // Exit if no data is available
    }

    const width = 900;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', `0 0 ${width + 250} ${height}`);

    // Add title to the scatter plot
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)  // Position the title slightly above the plot
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', 'black')
        .text('Average BVP During Baseline Condition (Experiment Session 2)');

    // X-axis: Participant ID
    xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.participant_id))
        .range([50, width - 50])
        .nice();

    // Y-axis: selectedBiometric (avg_bvp by default)
    yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d[selectedBiometric]))
        .range([height - 50, 50])
        .nice();

    // Scatter plot points
    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', d => xScale(d.participant_id))
        .attr('cy', d => yScale(d[selectedBiometric]))
        .attr('fill', 'steelblue')
        .attr('r', 8)
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, d) => {
            updateTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
            updateTooltipVisibility(false);
        });

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height - 50})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text("Participant ID");

    // Y axis
    svg.append('g')
        .attr('transform', `translate(50, 0)`)
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text(selectedBiometricDisplay);
}

// Tooltip Functions
function updateTooltipContent(d) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.innerHTML = `
        <dt>Participant ID</dt><dd>${d.participant_id}</dd>
        <dt>Average BVP</dt><dd>${d.avg_bvp.toFixed(3)}</dd>
    `;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.opacity = isVisible ? 1 : 0;
    tooltip.style.transition = 'opacity 0.3s';  // Fade in/out smoothly
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const offset = 10; // Space between the tooltip and the cursor

    // Positioning the tooltip slightly to the right and down of the mouse cursor
    tooltip.style.left = `${event.clientX + offset}px`;
    tooltip.style.top = `${event.clientY + offset}px`;
}
