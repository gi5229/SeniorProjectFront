

const fs =require('fs');
const path = require('path');
const {exec} =require('child_process');

//Function to mount the network drive and display it's contents 
function mountNetworkDrive(drivePath,networkDrive) {
    // Check if the drive is already mounted
    if (fs.existsSync(drivePath)) {
        // Display the contents of the mounted drive
        displayDriveContents(drivePath);
    } else {
        // Attempt to mount the drive using the `net` module 
        exec(`net use ${drivePath} ${networkDrive} /USER:username password`,(err)=>{ //replace usr,passwd with actual credentials
            if(err){
                console.error(`Error mounting drive: ${err}`);
                return;
            }
            // If mounting succeeds, display the contents
             displayDriveContents(drivePath);

        });
        
        
    }
}

// function to display the contents of the directory
function displayDriveContents(dirpath) {
    const ul= document.getElementById('drive-contents');
    ul.innerHTML = ''; //clears existing content
    fs.readdir(dirpath, (err, files) => {
        if (err) {
        console.error(err);
        return;
        }

        // Iterate through the files and directories
        files.forEach(file => {
        const filePath = path.join(dirpath, file);
        fs.stat(filePath, (err, stats) => {
            if (err) {
            console.error(err);
            return;
            }

        
            const li = document.createElement('li');
            li.textContent = filePath;
            ul.appendChild(li);
            if (stats.isDirectory()) {
            // Recursively display the contents of the subdirectory
                displayDriveContents(filePath);
            }
        });
        });
    });
}

//initialize mounting 
mountNetworkDrive('Z:', '\\\\server\\share');
