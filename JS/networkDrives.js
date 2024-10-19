

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to mount the network drive and display its contents
function mountNetworkDrive(drivePath, networkDrive, username, password) {
    // Check if the drive is already mounted
    if (fs.existsSync(drivePath)) {
        // Display the contents of the mounted drive
        displayDriveContents(drivePath);
    } else {
        // Attempt to mount the drive using a system command
        exec(`net use ${drivePath} ${networkDrive} /USER:${username} ${password}`, (err) => {
            if (err) {
                console.error(`Error mounting drive: ${err}`);
                return;
            }
            // If mounting succeeds, display the contents
            displayDriveContents(drivePath);
        });
    }
}

// Function to display the contents of a directory
function displayDriveContents(dirPath) {
    const ul = document.getElementById('drive-contents');
    ul.innerHTML = '';  // Clear any existing content

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const li = document.createElement('li');
                li.textContent = filePath;  // Adjust to show just the file name if desired
                ul.appendChild(li);

                if (stats.isDirectory()) {
                    displayDriveContents(filePath);  // Recursively display contents of subdirectories
                }
            });
        });
    });
}

// Initialize mounting
const drivePath= 'Z:';
const networkDrive ='\\Networkdrivepath\c';
const username = 'username';
const password = 'password';
mountNetworkDrive(drivePath,networkDrive,username,password);
