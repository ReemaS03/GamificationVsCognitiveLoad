import csv
import json
import os

# Dictionary to hold the data for all files except muse_eeg.csv
all_data = {
    "empatica_bvp": {
        "post": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        },
        "pre": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        }
    },
    "empatica_eda": {
        "post": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        },
        "pre": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        }
    },
    "empatica_temp": {
        "post": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        },
        "pre": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        }
    },
    "samsung_bvp": {
        "post": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        },
        "pre": {
            "baseline": [],
            "cognitive_load": [],
            "survey": []
        }
    }
}

# Define the path pattern
base_dir = "data/survey_gamification"

# List of CSV file names to process
csv_files = ["empatica_bvp.csv", "empatica_eda.csv", "empatica_temp.csv", "samsung_bvp.csv"]

# Function to calculate the average of values from a CSV file
def calculate_average(file_path, column_name):
    values = []
    if os.path.exists(file_path):
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)  # Use DictReader to read CSV as dictionaries
            for row in reader:
                try:
                    # Append the value for the specified column
                    values.append(float(row[column_name]))
                except ValueError:
                    continue
        if values:
            return sum(values) / len(values)
    return None

# Loop over student IDs from 11 to 24
for participant_id in range(11, 25):
    # Loop through conditions (baseline, cognitive_load, survey)
    for condition in ["baseline", "cognitive_load", "survey"]:
        for session in ["pre", "post"]:
            # Loop through each CSV file (empatica_bvp, empatica_eda, etc.)
            for csv_file in csv_files:
                # Construct the file path for each participant and file
                file_path = os.path.join(base_dir, str(participant_id), session, condition, csv_file)
                
                # Define the column name based on the CSV file
                if "bvp" in csv_file and "samsung" not in csv_file:
                    column_name = "bvp"
                elif "eda" in csv_file:
                    column_name = "eda"
                elif "temp" in csv_file:
                    column_name = "temp"
                elif "samsung" in csv_file:
                    column_name = "PPG GREEN"

                # Calculate the average for the current file and session/condition
                avg_value = calculate_average(file_path, column_name)
                
                if avg_value is not None:
                    file_name = csv_file.split(".")[0]  # Get the file name without extension
                    # Append the participant data with their calculated averages for the specific file/condition
                    all_data[file_name][session][condition].append({
                        "participant_id": participant_id,
                        "avg_value": avg_value
                    })
                else:
                    print(f"Warning: No valid values found for {csv_file} in {session} {condition} for participant {participant_id}")

# Store the result in a JSON file
output_file = "empatica_samsung_data.json"
with open(output_file, "w") as json_file:
    json.dump(all_data, json_file, indent=4)

print(f"Data has been saved to {output_file}")