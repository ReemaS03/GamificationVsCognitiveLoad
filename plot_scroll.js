import { fetchJSON } from './fetch-data.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];
let userSelections = {
    "empatica": { measurement: null, condition: null, session: null },
    "samsung": { measurement: null, condition: null, session: null }
};

// Available measurements for each device
const deviceMeasurementMap = {
    "empatica": ["bvp", "eda", "temp"],
    "samsung": ["bvp"] // Samsung only measures BVP
};

// Function to load the data
async function loadData() {
    data = await fetchJSON('./empatica_samsung_data.json'); 
    if (!data || data.length === 0) {
        console.error('No data found or failed to load data');
        return;
    }
    console.log("Loaded Data:", data);
    
    // Create dropdowns for each device
    createDropdowns("empatica");
    createDropdowns("samsung");

    setTimeout(() => {
        updatePlot("empatica", true);
        updatePlot("samsung", true);
    }, 100); // Small delay (100ms) to ensure dropdowns are available
    
}


// Function to create dropdowns for a given device
function createDropdowns(device) {
    const dropdownContainer = document.getElementById(`dropdown-container-${device}`);

    // Create a label container div
    const labelContainer = document.createElement("div");
    labelContainer.classList.add("label-container"); // Apply CSS styling

    // Measurement Type label (with two lines)
    const measurementLabel = document.createElement("label");
    measurementLabel.setAttribute("for", `measurementDropdown-${device}`);
    measurementLabel.innerHTML = "Measurement:<br><span class='sub-label'>(Y-Axis)</span>"; // Use innerHTML for line break

    labelContainer.appendChild(measurementLabel);
    dropdownContainer.appendChild(labelContainer); // Add to container


    // Measurement dropdown
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
    updatePlot(device, true);  

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

    // if (!measurementDropdown || !conditionDropdown || !sessionDropdown) {
    //     console.error(`Dropdowns not found for ${device}, skipping update.`);
    //     return;
    // }
    // If first time loading and user has not selected anything, apply default values
    if (isInitialLoad && !userSelections[device].measurement) {
        // console.log(device);
        // console.log(measurementDropdown.options[0].value);
        userSelections[device].measurement = "bvp";
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
    const participantIDs = Array.from({ length: 14 }, (_, i) => i + 11);

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

    // Scatter plot points with hover effects and tooltip
    svg.selectAll("circle")
    .data(selectedDeviceData.filter(d => participantIDs.includes(d.participant_id)))  // Only plot existing data
    .join("circle")
    .attr("cx", d => xScale(d.participant_id) + xScale.bandwidth() / 2)  
    .attr("cy", d => yScale(d.avg_value))
    .attr("r", 6) // Default size
    .attr("fill", d => condition === "survey" ? (d.gamified ? "#8A2BE2" : "#FFA500") : "#007bff") 
    .attr("opacity", 0.7)
    .style("transition", "all 0.2s ease-out")
    .on("mouseover", function(event, d) {
        let hoverColor, tooltipColor;

        if (condition === "survey") {
            hoverColor = d.gamified ? "#4B0082" : "#ff7000";  // Dark Purple, Dark Orange
            tooltipColor = d.gamified ? "#9f4fea" : "#FFA500";
        } else {
            hoverColor = "#ff6347";  // Red
            tooltipColor = "rgba(251, 160, 138, 0.95)";  
        }

        d3.select(this)
            .transition()
            .duration(150)
            .attr("r", 10)
            .attr("fill", hoverColor)
            .style("stroke", "#000")
            .style("stroke-width", "2px");

        tooltip.style("opacity", 1)
            .style("background-color", tooltipColor)
            .html(`<strong>Participant ID:</strong> ${d.participant_id}<br>
                   <strong>Value:</strong> ${d.avg_value.toFixed(3)}<br>
                   ${condition === "survey" ? `<strong>Gamified:</strong> ${d.gamified ? "Yes" : "No"}` : ""}`)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY + 15}px`)
            .style("transform", "translateY(0)"); // Moves tooltip smoothly into place
    })
    .on("mousemove", function(event) {
        tooltip.style("left", `${event.pageX + 15}px`)
               .style("top", `${event.pageY + 15}px`);
    })
    .on("mouseout", function() {
        d3.select(this)
            .transition()
            .duration(150)
            .attr("r", 6) // Reset size
            .attr("fill", d => condition === "survey" ? (d.gamified ? "#8A2BE2" : "#FFA500") : "#007bff")  // Reset color
            .style("stroke", "none"); // Remove outline
    
        tooltip.style("opacity", 0)
               .style("transform", "translateY(-5px)"); // Moves tooltip slightly up when fading out
    })
    .on("click", function(event, d) {
        // Hide tooltip immediately
        tooltip.style("opacity", 0);
    
        // Show line plot
        showLinePlot(device, measurement, condition, session, d.participant_id, containerId);
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
        .attr("y", -70)
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

async function showLinePlot(device, measurement, condition, session, participantId, containerId) {
    const plotContainer = d3.select(`#${containerId}`);

    // Fade out scatter plot
    plotContainer.transition()
        .duration(500)
        .style("opacity", 0)
        .on("end", async function () { 
            // Instead of clearing immediately, hide it first
            plotContainer.style("visibility", "hidden");

            // Wait a tiny bit (prevents empty screen flash)
            setTimeout(async () => {
                plotContainer.html("");  // Now clear it

                // Back Button (always visible)
                plotContainer.append("button")
                    .text("Back")
                    .attr("class", "back-button")
                    .style("position", "fixed")
                    .style("top", "10px")
                    .style("left", "10px")
                    .style("z-index", "1000")
                    .style("background", "#ff6347")
                    .style("color", "white")
                    .style("border", "none")
                    .style("padding", "8px 15px")
                    .style("border-radius", "5px")
                    .style("cursor", "pointer")
                    .on("click", function () {
                        // Fade out line plot first
                        d3.select(`#${containerId}`)
                            .transition()
                            .duration(500)
                            .style("opacity", 0)
                            .on("end", function () {
                                // Then clear and show scatter
                                updatePlot(device);
                    
                                // Fade scatter plot back in smoothly
                                d3.select(`#${containerId}`)
                                    .style("opacity", 0) // Set it hidden first
                                    .transition()
                                    .duration(500)
                                    .style("opacity", 1); // Fade it back in
                            });
                    });
                    

                let participantData = await fetchParticipantData(participantId, measurement, session, condition);

                // Sort by time (ascending order)
                participantData.sort((a, b) => a.time - b.time);
                                    
                if (!participantData) {
                    plotContainer.append("p").text("No data available for this participant.");
                    return;
                }

                const margin = { top: 50, right: 30, bottom: 100, left: 80 };
                const width = 750 - margin.left - margin.right;
                const height = 500 - margin.top - margin.bottom;

                const svg = plotContainer
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

                const xScale = d3.scaleLinear()
                    .domain([0, d3.max(participantData, d => d.time)])
                    .range([0, width]);

                const yScale = d3.scaleLinear()
                    .domain([d3.min(participantData, d => d.value) - 0.05, d3.max(participantData, d => d.value) + 0.05])
                    .range([height, 0]);

                const line = d3.line()
                    .x(d => xScale(d.time))
                    .y(d => yScale(d.value));

                // Create the path
                const path = svg.append("path")
                .datum(participantData)
                .attr("fill", "none")
                .attr("stroke", "#ff6347")
                .attr("stroke-width", 2)
                .attr("d", line)
                .attr("stroke-dasharray", function() {
                    return this.getTotalLength();  
                })
                .attr("stroke-dashoffset", function() {
                    return this.getTotalLength();  
                })
                .transition()
                .duration(10000)  
                .ease(d3.easeLinear)
                .attrTween("stroke-dashoffset", function() {
                    const length = this.getTotalLength();
                    return function(t) {
                        return length * (1 - t); // Smoothly draws from left to right
                    };
                });
                

                svg.append("g")
                    .attr("transform", `translate(0, ${height})`)
                    .call(d3.axisBottom(xScale));

                svg.append("g")
                    .call(d3.axisLeft(yScale));

                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height + 40)
                    .attr("fill", "black")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "14px")
                    .text("Time (seconds)");

                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -height / 2)
                    .attr("y", -50)
                    .attr("fill", "black")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "14px")
                    .text(measurement.toUpperCase());

                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", -20)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("font-weight", "bold")
                    .text(`Participant ${participantId} - ${measurement.toUpperCase()} Over Time`);

                // Fade in new plot smoothly (avoids flash)
                plotContainer.style("visibility", "visible")
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
            }, 100); // Small delay to prevent flicker
        });
}




// Load data and initialize the page
loadData();

async function fetchParticipantData(participantId, measurement, session, condition) {
    const filePath = `./data/survey_gamification/${participantId}/${session}/${condition}/empatica_${measurement}.csv`;

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.error(`Failed to load data for participant ${participantId}`);
            return null;
        }
        const text = await response.text();
        const rows = text.split("\n").slice(1); // Skip header

        return rows.map(row => {
            const [value, time] = row.split(","); 
            return { 
                time: parseFloat(time),  // Time is in column 2
                value: parseFloat(value) // Measurement is in column 1
            };
        }).filter(d => !isNaN(d.time) && !isNaN(d.value))  //  Remove invalid rows
          .map((d, i, arr) => ({
              time: d.time - arr[0].time, //  Normalize time to start from 0
              value: d.value
          }));

    } catch (error) {
        console.error(`Error loading data: ${error}`);
        return null;
    }
}


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



document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-button");
    const contentContainer = document.getElementById("content-container");

    function activateTab(tabName) {
        tabs.forEach(t => t.classList.remove("active"));

        // Hide all content boxes at first
        document.querySelectorAll(".content-box").forEach(box => box.classList.add("hidden"));

        // Remove default message
        contentContainer.classList.remove("default-message");

        // Clear previous content before appending new one
        contentContainer.innerHTML = "";  

        // Activate the selected tab
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        selectedTab.classList.add("active");

        // Get the corresponding content
        const selectedContent = document.getElementById(`${tabName}-content`);

        if (selectedContent) {
            const clonedContent = selectedContent.cloneNode(true);
            clonedContent.classList.remove("hidden");
            contentContainer.appendChild(clonedContent);
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            activateTab(this.dataset.tab);
        });
    });
});


