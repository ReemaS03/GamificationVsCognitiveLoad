import { fetchJSON } from './fetch-data.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];
let userSelections = {
    "empatica": { measurement: null, condition: null, session: null },
    "samsung": { measurement: null, condition: null, session: null },
    "muse_s": { measurement: null, condition: null, session: null }
};

// Available measurements for each device
const deviceMeasurementMap = {
    "empatica": ["bvp", "eda", "temp"],
    "samsung": ["bvp"], // Samsung only measures BVP
    "muse_s": ["bvp", "eda"] // Muse can measure BVP and EDA
};

// Function to load the data
async function loadData() {
    data = await fetchJSON('./empatica_samsung_data.json'); // Adjust the path to your JSON data
    if (!data || data.length === 0) {
        console.error('No data found or failed to load data');
        return;
    }
    console.log("Loaded Data:", data);

    // Create dropdowns for each device
    createDropdowns("empatica");
    createDropdowns("samsung");
    // createDropdowns("muse_s");

}


// Function to create dropdowns for a given device
function createDropdowns(device) {
    const dropdownContainer = document.getElementById(`dropdown-container-${device}`);

    // Measurement Type dropdown
    const measurementLabel = document.createElement("label");
    measurementLabel.setAttribute("for", `measurementDropdown-${device}`);
    measurementLabel.textContent = "Measurement: ";
    dropdownContainer.appendChild(measurementLabel);

    const measurementDropdown = document.createElement("select");
    measurementDropdown.setAttribute("id", `measurementDropdown-${device}`);
    dropdownContainer.appendChild(measurementDropdown);
    dropdownContainer.appendChild(document.createElement("br")); 

    // Condition dropdown
    const conditionLabel = document.createElement("label");
    conditionLabel.setAttribute("for", `conditionDropdown-${device}`);
    conditionLabel.textContent = "Condition: ";
    dropdownContainer.appendChild(conditionLabel);

    const conditionDropdown = document.createElement("select");
    conditionDropdown.setAttribute("id", `conditionDropdown-${device}`);
    const conditions = ["baseline", "cognitive_load", "survey"];
    conditions.forEach(condition => {
        const option = document.createElement("option");
        option.value = condition;
        option.textContent = condition.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
        conditionDropdown.appendChild(option);
    });
    dropdownContainer.appendChild(conditionDropdown);
    dropdownContainer.appendChild(document.createElement("br"));

    // Session dropdown
    const sessionLabel = document.createElement("label");
    sessionLabel.setAttribute("for", `sessionDropdown-${device}`);
    sessionLabel.textContent = "Experiment Session: ";
    dropdownContainer.appendChild(sessionLabel);

    const sessionDropdown = document.createElement("select");
    sessionDropdown.setAttribute("id", `sessionDropdown-${device}`);
    const sessions = ["pre", "post"];
    sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session;
        option.textContent = session === "pre" ? "Session 1 (Pre)" : "Session 2 (Post)";
        sessionDropdown.appendChild(option);
    });
    dropdownContainer.appendChild(sessionDropdown);
    dropdownContainer.appendChild(document.createElement("br"));

    // Event Listeners to store user selections before updating plot
    measurementDropdown.addEventListener("change", () => {
        userSelections[device].measurement = measurementDropdown.value;
        updatePlot(device);
    });

    conditionDropdown.addEventListener("change", () => {
        userSelections[device].condition = conditionDropdown.value;
        updatePlot(device);
    });

    sessionDropdown.addEventListener("change", () => {
        userSelections[device].session = sessionDropdown.value;
        updatePlot(device);
    });

    // Initialize the measurement dropdown based on the first device
    updateMeasurementOptions(device);
}


// Update the Measurement Type dropdown based on the selected device
function updateMeasurementOptions(device) {
    const measurementDropdown = document.getElementById(`measurementDropdown-${device}`);

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

// Function to update the plot based on dropdown selections for a specific device
function updatePlot(device, isInitialLoad = false) {
    const measurementDropdown = document.getElementById(`measurementDropdown-${device}`);
    const conditionDropdown = document.getElementById(`conditionDropdown-${device}`);
    const sessionDropdown = document.getElementById(`sessionDropdown-${device}`);

    // If first time loading and user has not selected anything, apply default values
    if (isInitialLoad && !userSelections[device].measurement) {
        userSelections[device].measurement = measurementDropdown.options[0].value;
        userSelections[device].condition = "baseline";
        userSelections[device].session = "pre";
    }

    // Use stored values
    measurementDropdown.value = userSelections[device].measurement;
    conditionDropdown.value = userSelections[device].condition;
    sessionDropdown.value = userSelections[device].session;

    const measurement = measurementDropdown.value;
    const condition = conditionDropdown.value;
    const session = sessionDropdown.value;

    createScatterplot(device, measurement, condition, session, `chart-${device}`);
}



// Function to create scatterplot for a specific device
function createScatterplot(device, measurement, condition, session, containerId) {
    if (!data || data.length === 0) {
        console.error(`No data available for ${device}`);
        return;
    }

    const selectedDeviceData = data[`${device}_${measurement}`]?.[session]?.[condition];

    if (!selectedDeviceData) {
        console.error(`No data found for ${device} (${measurement}, ${condition}, ${session})`);
        return;
    }

    // Set the width and height of the plot
    const margin = { top: 50, right: 30, bottom: 100, left: 80 };
    const width = 750 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear any existing plot in the container
    d3.select(`#${containerId}`).html("");

    // Create an SVG container for the scatter plot
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Extract all participant IDs for the X-axis
    const participantIDs = selectedDeviceData.map(d => d.participant_id);

    // X-axis: Show all participant IDs as labels
    const xScale = d3.scaleBand()
        .domain(participantIDs)  
        .range([0, width])
        .padding(0.2);  

    // Y-axis: avg_value (biometric values)
    const yScale = d3.scaleLinear()
        .domain([d3.min(selectedDeviceData, d => d.avg_value) - 0.05, 
                 d3.max(selectedDeviceData, d => d.avg_value) + 0.05])
        .range([height, 0])
        .nice();

    // Tooltip container
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("border-radius", "5px");

    // Scatter plot points with tooltip
    svg.selectAll("circle")
        .data(selectedDeviceData)
        .join("circle")
        .attr("cx", d => xScale(d.participant_id) + xScale.bandwidth() / 2)  
        .attr("cy", d => yScale(d.avg_value))
        .attr("r", 6)
        .attr("fill", "#007bff")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`Participant ID: ${d.participant_id}<br>Value: ${d.avg_value.toFixed(3)}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    // X-axis with all participant IDs
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-size", "12px");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Participant ID");

    // Y-Axis Label
    const measurementLabels = {
        "bvp": "Blood Volume Pulse (BVP)",
        "eda": "Electrodermal Activity (EDA)",
        "temp": "Skin Temperature (Temp)"
    };
    
    const yAxisLabel = measurementLabels[measurement] || "Measurement Value";

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text(yAxisLabel);

    // Chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(`${device.toUpperCase()} - ${measurement.toUpperCase()} (${condition}, ${session})`);
}



// Load data and initialize the page
loadData();




// Function to check if section is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
}

// Apply fade-in and fade-out effect on sections
function handleScroll() {
    document.querySelectorAll('.section').forEach(section => {
        if (isInViewport(section)) {
            section.classList.add('visible');  

            // Only update the plot the first time it's seen
            if (!section.dataset.loaded) {
                section.dataset.loaded = "true"; 
                if (section.id === "empatica") updatePlot("empatica", true);
                if (section.id === "samsung") updatePlot("samsung", true);
                if (section.id === "muse") updatePlot("muse_s", true);
            }
        } else {
            section.classList.remove('visible');
        }
    });
}

// Run on scroll
document.addEventListener("scroll", handleScroll);
document.addEventListener("DOMContentLoaded", handleScroll); 

handleScroll();


// Update progress bar as user scrolls
function updateProgressBar() {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    document.getElementById("progress-bar").style.width = scrollPercent + "%";
}

document.addEventListener("scroll", updateProgressBar);

updateProgressBar();
