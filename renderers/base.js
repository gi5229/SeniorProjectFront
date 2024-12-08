
var firstClick = true;
let darkmode = localStorage.getItem('darkmode');
const authService = require('../services/auth-service');
const { Chart, registerables } = require('chart.js');

const charts = {};

// Register the components
Chart.register(...registerables);

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {
  }
}

if (darkmode === 'active') {
  enableDarkmode()
}

addEventListener('load',async  () =>{
  // reload the tokens
  await authService.refreshTokens();
  const profile = await authService.getProfile();
  document.getElementById('picture').src = profile.picture;
  //document.getElementById('success').innerText = 'You successfully used OpenID Connect and OAuth 2.0 to authenticate.';
});

document.getElementById('logout').onclick = () => {
  authService.createLogoutWindow();
};

document.getElementById('hamburger-menu').addEventListener('click', function() {
  this.classList.toggle('active');
  document.getElementById('nav-profile').classList.toggle('open');
});

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function generateBackgroundColors(numColors) {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(getRandomColor());
  }
  return colors;
}

function initializeChart(chartId, chartElement, chartLabels, chartData, backgroundColors = null, height = 200) {
  if (!backgroundColors) {
    backgroundColors = generateBackgroundColors(chartLabels.length);
  }

  if (charts[chartId]) {
    charts[chartId].destroy(); // Destroy the existing chart instance
  }

  charts[chartId] = new Chart(chartElement, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'GB',
        data: chartData,
        backgroundColor: backgroundColors,
        hoverOffset: 4
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font: {
              size: 16, // Set the font size for the labels
            },
            color: 'white' // Set the font color for the labels
          }
        }
      }
    }
  });
  charts[chartId].canvas.parentNode.style.height = `${height}px`;
}


async function initializeDatasets() {
    // reload the tokens
    await authService.refreshTokens();

    const profile = await authService.getProfile();
    const datasets = profile.datasets;
  
    const container = document.getElementById('dataset-container');
    // Clear the container
    container.innerHTML = '';
  
    // Check if any of the users datasets are already mounted
    const mountedDrive = await authService.getMountedDrive();
    const chartElement = document.getElementById('usage-graph').getContext('2d');
    chartElement.innerHTML = "";
    const chartLabels = ['Used', 'Free'];
    // TODO: Get the actual data from the API
    var totalUsage = await authService.getTotalUsage();
    
    //var totalUsage = 10000000000;
    // Convert to GB from bits
    totalUsage = totalUsage.data.used / 1024 / 1024 / 1024;
    console.log('totalUsage: ', totalUsage);
    var freeSpace = 5 - totalUsage;
    const chartData = [totalUsage, freeSpace];
    const chartColors = ['#FF6384', '#36A2EB'];
    
    initializeChart('usageChart', chartElement, chartLabels, chartData, chartColors, 500);

    

    
    datasets.forEach((dataset, index) => {
      if (mountedDrive.letter !== null && mountedDrive.providerName === dataset) {
        // If the dataset is already mounted, show a disconnect button instead
        const div = document.createElement('div');
        div.className = 'select-drive';
        div.innerHTML = `
            <span class='letter'>${mountedDrive.letter}: //${dataset}/ </span>
            <button id="disconnect-${index}" class="disconnect-btn black-text">Disconnect</button>
        `;
        container.appendChild(div);


        // Add event listener for the disconnect button
        document.getElementById(`disconnect-${index}`).onclick = async () => {
          console.log(`Disconnecting from dataset: ${dataset} with drive letter: ${mountedDrive.letter}`);
          await authService.unmountDrive(mountedDrive.letter);
          loadPage('files.html', true);
        }
      } else {
        // Create a dropdown and button for each dataset
        const div = document.createElement('div');
        div.className = 'select-drive';
        // Dont include the drive letter if it is in mountedDrive.letters
        if(mountedDrive.letters !== null) {
          console.log('index: ', index)
          div.innerHTML = `
              <select id="drive-letter-${index}" class="black-text letter">
                  ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .filter(letter => !mountedDrive.letters.includes(letter))
                    .map(letter => `<option value="${letter}" class="black-text">${letter}</option>`)
                    .join('')}
              </select>
              <span id='dataset'>//${dataset}/</span>
              <button id="delete-${index}" class="delete-btn black-text">Delete</button>
              <button id="connect-${index}" class="connect-btn black-text">Connect</button>
          `;
        } else {
          console.log('index: ', index)
          div.innerHTML = `
              <select id="drive-letter-${index}" class="black-text">
                  ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .map(letter => `<option value="${letter}" class="black-text">${letter}</option>`)
                    .join('')}
              </select>
              <span id='dataset'>//${dataset}/</span>
              <button id="delete-${index}" class="delete-btn black-text">Delete</button>
              <button id="connect-${index}" class="connect-btn black-text">Connect</button>
          `;
        }
        container.appendChild(div);
        console.log('index: ', index)
        // Add event listener for the connect button
        document.getElementById(`connect-${index}`).onclick = () => {
          // Check if another drive is already mounted and unmount it first and wait for it to finish
          if (mountedDrive) {
            authService.unmountDrive(mountedDrive.letter);
          }
          // Wait for 2 seconds to make sure the drive is unmounted before mounting a new one
          //sleep(2000);
          
          
          const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
          console.log(`Connecting to dataset: ${dataset} with drive letter: ${selectedDriveLetter}`);
          authService.mountDrive(selectedDriveLetter, profile.drive + '\\' + dataset);
          loadPage('files.html', true);
        }

        // Add event listener for the delete button
        document.getElementById(`delete-${index}`).onclick = async () => {
          console.log(`Deleting dataset: ${dataset}`);
          await authService.deleteDrive(dataset);
          loadPage('files.html', true);
        }
      }
  });
}



document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('home-button').addEventListener('click', () => loadPage('about.html'));
  document.getElementById('drives-button').addEventListener('click', () => loadPage('files.html'));
  document.getElementById('usage-button').addEventListener('click', () => loadPage('usage.html'));
  document.getElementById('settings-button').addEventListener('click', () => loadPage('settings.html'));
});

async function loadPage(page, skipAnimation = false) {
  const content = document.getElementById('content');
  const hamburger = document.getElementById('hamburger-menu');
  const navProfile = document.getElementById('nav-profile');

  if(firstClick == false){
    if (skipAnimation !== true) {
      const hamburger = document.getElementById('hamburger-menu');
      const navProfile = document.getElementById('nav-profile');

      hamburger.classList.toggle('active');
      navProfile.classList.toggle('open');
    }
  } else {
    firstClick = false;
  }

  content.classList.add('fade-out');

  // Wait for the fade-out transition to complete
  await new Promise(resolve => setTimeout(resolve, 500));

  const response = await fetch(page);
  const newContent = await response.text();
  content.innerHTML = newContent;
  if (page === 'files.html') {
    await initializeDatasets();
    document.getElementById('create-drive').onclick = async () => {
      try {
        console.log('Creating a new drive: ' + document.getElementById('drive-name').value);
        const response = await authService.createDrive(document.getElementById('drive-name').value);
        addDriveToList(document.getElementById('drive-name').value);
      } catch (error) {
        console.error('Error connecting to the API: ' + error);
      }
    };
  } else if (page === 'settings.html') {
    var slider = document.getElementById('color-slider');

    if(localStorage.getItem('darkmode') === 'active') {
      slider.checked = true;
    } else {
      slider.checked = false;
    }
  
    document.getElementById('color-slider').addEventListener("change", function() {

      if (this.checked) {
        enableDarkmode()
      } else {
        disableDarkmode()
      }
    });
    

    document.getElementById('change-email').onclick = async () => {
      const newEmail = document.getElementById('new-email').value;
      await authService.changeEmail(newEmail);
    };

    
    document.getElementById('change-password').onclick = async () => {
      const newPassword = document.getElementById('new-password').value;
      await authService.changePassword(newPassword);
    };
  };

  content.classList.remove('fade-out');
}

function addDriveToList(driveName) {
  const container = document.getElementById('dataset-container');
  const index = container.children.length;
  const div = document.createElement('div');
  div.innerHTML = `
    <select id="drive-letter-${index}">
      ${Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
        .map(letter => `<option value="${letter}">${letter}</option>`)
        .join('')}
    </select>
    <span>//${driveName}/</span>
    <button id="connect-${index}" class="connect-btn">Connect</button>
  `;
  container.appendChild(div);

  document.getElementById(`connect-${index}`).onclick = () => {
    const selectedDriveLetter = document.getElementById(`drive-letter-${index}`).value;
    console.log(`Connecting to dataset: ${driveName} with drive letter: ${selectedDriveLetter}`);
    authService.mountDrive(selectedDriveLetter, driveName);
  };
}
function enableDarkmode()  {
  document.body.classList.remove('defaultColor')
  document.body.classList.add('darkmode')
  localStorage.setItem('darkmode', 'active')
}

function disableDarkmode () {
  document.body.classList.add('defaultColor')
  document.body.classList.remove('darkmode')
  localStorage.setItem('darkmode', null)
}

// Load the initial page
loadPage('about.html');



(function() {
  console.log("Shared script is running!");

  function formatDateTime(date) {
      const options = {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
      };
      return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function addSessionHistoryItem(message) {
      const sessionList = document.getElementById('sessionList');
      if (!sessionList) {
          console.error("sessionList element not found");
          return;
      }
      console.log("Adding item:", message);
      const listItem = document.createElement('li');
      listItem.textContent = message;
      sessionList.prepend(listItem); // Prepend to show most recent first
  }

  function loadSessionHistory() {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
      console.log("Loaded session history:", sessionHistory);
      sessionHistory.forEach(item => addSessionHistoryItem(item)); // Display in original order to show most recent first
  }

  function saveSessionHistory(message) {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
      sessionHistory.unshift(message); // Add new messages to the beginning
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
      console.log("Saved session history:", sessionHistory);
  }

  // Only end session when window is closed
  window.addEventListener('beforeunload', (event) => {
      saveSessionHistory(`Session ended at ${formatDateTime(new Date())}`);
      console.log("Session end logged on window close.");
  });

  document.addEventListener('DOMContentLoaded', () => {
      const pageName = window.location.pathname.split("/").pop();
      console.log("Page Name:", pageName);

      if (pageName.includes('home')) {
          saveSessionHistory(`Session started at ${formatDateTime(new Date())}`); // Log session start
          console.log("Session start logged.");
      } else if (pageName.includes('settings')) {
          displaySessionHistory(); // Display session history when the settings page loads

          document.getElementById('clearButton').addEventListener('click', () => {
              localStorage.removeItem('sessionHistory');
              const sessionList = document.getElementById('sessionList');
              if (sessionList) {
                  sessionList.innerHTML = ''; // Clear displayed session list
              }
              console.log("Cleared session history");
          });
      }
  });

  window.displaySessionHistory = function() {
      loadSessionHistory();
  };
})();