import { fetchJSON } from './fetch-data.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];

// Mapping of the dropdown labels (device names only) to internal keys in the JSON data
const deviceMapping = {
    "Empatica E4 Wristband": "empatica",
    "Samsung Galaxy Watch4": "samsung",
    "Muse S EEG Headband": "muse_s"
};

// Available measurements for each device (this reflects internal keys, e.g., empatica_bvp, samsung_bvp)
const deviceMeasurementMap = {
    "empatica": ["bvp", "eda", "temp"],
    "samsung": ["bvp"], // Samsung only measures BVP
    "muse_s": [] // Muse can measure BVP and EDA
};

// Function to load the data
async function loadData() {
    data = await fetchJSON('./empatica_samsung_data.json'); // Adjust the path to your JSON data
    if (!data || data.length === 0) {
        console.error('No data found or failed to load data');
        return;
    }
    console.log("Loaded Data:", data);

    // Create dropdowns dynamically after data is loaded
    createDropdowns();

    // Initialize the plot with default dropdown values
    updatePlot();
}

// Function to create the dropdowns in JS
function createDropdowns() {
    const dropdownContainer = document.getElementById("dropdown-container");

    // Device dropdown
    const deviceLabel = document.createElement("label");
    deviceLabel.setAttribute("for", "deviceDropdown");
    deviceLabel.textContent = "Device: ";
    dropdownContainer.appendChild(deviceLabel);

    const deviceDropdown = document.createElement("select");
    deviceDropdown.setAttribute("id", "deviceDropdown");
    
    // Add options to the device dropdown (only device names)
    for (const deviceName in deviceMapping) {
        const option = document.createElement("option");
        option.value = deviceMapping[deviceName];
        option.textContent = deviceName;
        deviceDropdown.appendChild(option);
    }

    dropdownContainer.appendChild(deviceDropdown);
    dropdownContainer.appendChild(document.createElement("br")); // Add a line break

    // Measurement Type dropdown (will be populated dynamically)
    const measurementLabel = document.createElement("label");
    measurementLabel.setAttribute("for", "measurementDropdown");
    measurementLabel.textContent = "Measurement: ";
    dropdownContainer.appendChild(measurementLabel);

    const measurementDropdown = document.createElement("select");
    measurementDropdown.setAttribute("id", "measurementDropdown");
    dropdownContainer.appendChild(measurementDropdown);
    dropdownContainer.appendChild(document.createElement("br")); // Add a line break

    // Condition dropdown
    const conditionLabel = document.createElement("label");
    conditionLabel.setAttribute("for", "conditionDropdown");
    conditionLabel.textContent = "Condition: ";
    dropdownContainer.appendChild(conditionLabel);

    const conditionDropdown = document.createElement("select");
    conditionDropdown.setAttribute("id", "conditionDropdown");
    const conditions = ["baseline", "cognitive_load", "survey"];
    conditions.forEach(condition => {
        const option = document.createElement("option");
        option.value = condition;
        option.textContent = condition.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
        conditionDropdown.appendChild(option);
    });
    dropdownContainer.appendChild(conditionDropdown);
    dropdownContainer.appendChild(document.createElement("br")); // Add a line break

    // Session dropdown
    const sessionLabel = document.createElement("label");
    sessionLabel.setAttribute("for", "sessionDropdown");
    sessionLabel.textContent = "Experiment Session: ";
    dropdownContainer.appendChild(sessionLabel);

    const sessionDropdown = document.createElement("select");
    sessionDropdown.setAttribute("id", "sessionDropdown");
    const sessions = ["pre", "post"];
    sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session;
        option.textContent = session === "pre" ? "Session 1 (Pre)" : "Session 2 (Post)";
        sessionDropdown.appendChild(option);
    });
    dropdownContainer.appendChild(sessionDropdown);
    dropdownContainer.appendChild(document.createElement("br")); // Add a line break

    // Add event listeners to update the plot when a selection is made
    deviceDropdown.addEventListener("change", updateMeasurementOptions);
    deviceDropdown.addEventListener("change", updatePlot);
    measurementDropdown.addEventListener("change", updatePlot); // Ensure measurement changes trigger update
    conditionDropdown.addEventListener("change", updatePlot);
    sessionDropdown.addEventListener("change", updatePlot);

    // Initialize the measurement dropdown based on the first device
    updateMeasurementOptions();
}

// Update the Measurement Type dropdown based on the selected device
function updateMeasurementOptions() {
    const device = document.getElementById("deviceDropdown").value;
    const measurementDropdown = document.getElementById("measurementDropdown");

    // Clear existing options
    measurementDropdown.innerHTML = "";

    // Get available measurements for the selected device
    const availableMeasurements = deviceMeasurementMap[device] || [];

    // Add the measurements to the dropdown
    availableMeasurements.forEach(measurement => {
        const option = document.createElement("option");
        option.value = measurement;
        option.textContent = measurement.toUpperCase();
        measurementDropdown.appendChild(option);
    });
}

// Function to update the plot based on dropdown selections
function updatePlot() {
    const device = document.getElementById("deviceDropdown").value;
    const measurement = document.getElementById("measurementDropdown").value;
    const condition = document.getElementById("conditionDropdown").value;
    const session = document.getElementById("sessionDropdown").value;

    createScatterplot(device, measurement, condition, session);
}

// Function to create scatterplot with selected values
function createScatterplot(device, measurement, condition, session) {
    if (!data || data.length === 0) {
        console.error('No data available to plot');
        return;  // Exit if no data is available
    }

    // Access the correct data based on the selected device, measurement, condition, and session
    const selectedDeviceData = data[`${device}_${measurement}`]?.[session]?.[condition];

    if (!selectedDeviceData) {
        console.error(`No data found for ${device} measuring ${measurement} in condition ${condition} for session ${session}`);
        return;
    }

    // Set the width and height of the plot and define margins
    const margin = { top: 50, right: 30, bottom: 70, left: 60 };
    const width = 750 - margin.left - margin.right;  // Adjust width
    const height = 500 - margin.top - margin.bottom;  // Adjust height

    // Create an SVG container for the scatter plot
    const svg = d3
        .select('#chart')
        .html('')  // Clear any existing content
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create the title based on the selected options
    const deviceName = Object.keys(deviceMapping).find(name => deviceMapping[name] === device);
    const conditionName = condition.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
    const sessionName = session === 'pre' ? "Experiment Session 1" : "Experiment Session 2";
    const titleText = `${deviceName} (${measurement.toUpperCase()}) ${conditionName} ${sessionName}`;

    // Add title to the plot
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text(titleText);

    // Determine the appropriate yBuffer dynamically based on the measurement
    let yBuffer = 0.05;  // Default buffer for most measurements

    if (device === 'samsung') {
        // Increase the buffer for high-precision Samsung measurements
        yBuffer = 10000;
    }

    // Buffer for the axes to ensure points are not too close to the axis
    const xBuffer = 1;  // Buffer for participant_id

    // X-axis: Participant ID
    const xScale = d3
        .scaleLinear()
        .domain([d3.min(selectedDeviceData, d => d.participant_id) - xBuffer, 
                 d3.max(selectedDeviceData, d => d.participant_id) + xBuffer])
        .range([0, width])
        .nice();

    // Y-axis: avg_value (biometric values)
    const yScale = d3
        .scaleLinear()
        .domain([d3.min(selectedDeviceData, d => d.avg_value) - yBuffer, 
                 d3.max(selectedDeviceData, d => d.avg_value) + yBuffer])
        .range([height, 0])
        .nice();

    // Scatter plot points with tooltip integration
    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(selectedDeviceData)
        .join('circle')
        .attr('cx', d => xScale(d.participant_id))
        .attr('cy', d => yScale(d.avg_value))
        .attr('r', 8)
        .style('fill-opacity', 0.7)
        .on('mouseover', function(event, d) {
            updateTooltipContent(d);  // Update content with participant ID and BVP value
            updateTooltipVisibility(true);  // Show the tooltip
        })
        .on('mousemove', function(event) {
            updateTooltipPosition(event);  // Update tooltip position based on mouse movement
        })
        .on('mouseout', function() {
            updateTooltipVisibility(false);  // Hide the tooltip when the mouse leaves the circle
        });

    // X-axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .attr('class', 'axis-tick')
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text("Participant ID")
        .attr('class', 'axis-label');

    // Y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .attr('class', 'axis-tick')
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Avg Value')
        .attr('class', 'axis-label');
}


// Tooltip Functions
function updateTooltipContent(d) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.innerHTML = `
        <dt>Participant ID</dt><dd>${d.participant_id}</dd>
        <dt>Average Value</dt><dd>${d.avg_value.toFixed(3)}</dd>
    `;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.opacity = isVisible ? 1 : 0;
    tooltip.style.transition = 'opacity 0.3s';  // Fade in/out smoothly
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

// Load the data when the page loads
loadData();