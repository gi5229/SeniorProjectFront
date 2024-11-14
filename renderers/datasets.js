addEventListener('load', async () => {
    // reload the tokens
    await window.electronAPI.refreshTokens();

    const profile = await window.electronAPI.getProfile();
    const datasets = profile.datasets;

    const container = document.getElementById('dataset-container');

    datasets.forEach((dataset, index) => {
        // Create a dropdown and button for each dataset
        const div = document.createElement('div');
        div.innerHTML = `
            <select id="drive-letter-${index}">
                ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .map(letter => `<option value="${letter}">${letter}</option>`)
                    .join('')}
            </select>
            <span>//${dataset}/</span>
            <button id="connect-${index}" class="connect-btn">Connect</button>
        `;
        container.appendChild(div);

        // Add event listener for the connect button
        document.getElementById(`connect-${index}`).onclick = () => {
            const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
            console.log(`Connecting to dataset: ${dataset} with drive letter: ${selectedDriveLetter}`);
            window.electronAPI.mountDrive(selectedDriveLetter, profile.drive + '\\' + dataset);
        };
    });
});

// Listen for a click on the create drive button and take in the user input
document.getElementById('create-drive').onclick = async () => {
    try {
        console.log('Creating a new drive: ' + document.getElementById('drive-name').value);
        const response = await window.electronAPI.createDrive(document.getElementById('drive-name').value);
        //refresh the page
        location.reload();
    } catch(error) {
        console.error('Error connecting to the API: ' + error);
    }
};