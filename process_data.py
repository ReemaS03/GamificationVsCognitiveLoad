import csv
import json
import os

# List to hold student IDs and corresponding average BVP values
empatica_bvp_post_baseline = []

# Define the path pattern
base_dir = "data/survey_gamification"

# Loop over student IDs from 11 to 24
for participant_id in range(11, 25):
    # Construct the file path
    file_path = os.path.join(base_dir, str(participant_id), "post", "baseline", "empatica_bvp.csv")
    
    # Check if the file exists
    if os.path.exists(file_path):
        # Open the CSV file
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)  # Use DictReader to read CSV as dictionaries
            bvp_values = []
            
            # Loop through each row and collect 'bvp' values
            for row in reader:
                try:
                    # Convert 'bvp' to float and append to list
                    bvp_values.append(float(row['bvp']))
                except ValueError:
                    # If 'bvp' can't be converted to float, skip this value
                    print(f"Warning: Invalid 'bvp' value found for student {participant_id} in row {row}")

            if bvp_values:
                # Calculate the average of 'bvp' values
                avg_bvp = sum(bvp_values) / len(bvp_values)
                # Add the student ID and average BVP to the list
                empatica_bvp_post_baseline.append({
                    "participant_id": participant_id,
                    "avg_bvp": avg_bvp
                })
            else:
                print(f"Warning: No valid 'bvp' values found for student {participant_id}")
    else:
        print(f"Warning: File not found for student {participant_id}: {file_path}")

# Save the result to a JSON file
output_file = "empatica_bvp_post_baseline.json"
with open(output_file, "w") as json_file:
    json.dump(empatica_bvp_post_baseline, json_file, indent=4)

print(f"Data has been processed and saved to {output_file}")